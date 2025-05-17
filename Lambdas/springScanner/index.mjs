import OpenAI from 'openai';
const openai = new OpenAI({ apiKey: process.env.openaiAPIKey });
import { getSignedUrl } from '@aws-sdk/cloudfront-signer';
import { DynamoDBDocumentClient, PutCommand } from "@aws-sdk/lib-dynamodb";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  TopicClient, TopicConfigurations, CredentialProvider
} from "@gomomento/sdk";

const privateKeyRaw = process.env.privateKey;
const privateKey = privateKeyRaw.replace(/\\n/g, '\n');
const cloudfrontDistributionDomain = process.env.cloudfrontDistributionDomain;
const keyPairId = process.env.keyPairId;
const intervalToAddInMilliseconds = 150 * 1000; // 150 seconds

const apiKey = process.env.MOMENTO_API_KEY;
const PUBSUB_CACHE_NAME = 'publish-subscribe-cache';
const topicClient = new TopicClient({
  configuration: TopicConfigurations.Lambda.latest(),
  credentialProvider: CredentialProvider.fromString(apiKey)
});

const tableName = process.env.tableName || "SpringPokedex";
const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

const storeToDynamoDB = async (userId, scanId, gptResponse) => {
  try {
    const command = new PutCommand({
      TableName: tableName,
      Item: {
        userId,
        scanId,
        gptResponse,
        date: (new Date()).toISOString().split('T')[0]
      }
    });

    const response = await docClient.send(command);
  }
  catch (error) {
    console.error("Error storing data in DynamoDB:", error);
  }
}

const publishToTopic = async (userSub, gptResponse, key) => {
  const topicName = userSub;
  const type = "ProcessingSuccess";
  const message = JSON.stringify({ gptResponse, key, type });
  await topicClient.publish(PUBSUB_CACHE_NAME, topicName, message);
}

const generateSignedUrl = async (s3ObjectKey) => {
  const url = `${cloudfrontDistributionDomain}/${s3ObjectKey}`;
  const policy = {
    Statement: [
      {
        Resource: url,
        Condition: {
          DateLessThan: {
            "AWS:EpochTime": Math.floor((Date.now() + intervalToAddInMilliseconds) / 1000),
          },
        },
      },
    ],
  };

  const policyString = JSON.stringify(policy);
  const signedUrl = getSignedUrl({
    keyPairId,
    privateKey,
    policy: policyString,
  });

  return signedUrl;
};

export const handler = async (event) => {

  const key = decodeURIComponent(
    event.Records[0].s3.object.key.replace(/\+/g, ' ')
  );

  const userSub = key.split('/')[1]; // Extract userSub from the key - images are uploaded at /images/userSub/imageName
  const fileName = key.split('/')[2]; // Extract file name from the key
  const fileNameWithoutExtension = fileName.split('.').slice(0, -1).join('.'); // Extract file name without extension

  const signedUrl = await generateSignedUrl(key);

  const completion = await openai.chat.completions.create({
    model: 'gpt-4.1',
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'text',
            text: `
            Identify the species in this image for a Pokédex-like application. Please output the result in JSON format containing the following fields: commonName, scientificName, and info.
            
            category: Broad category where the species belongs (e.g., "Birds", "Mammals", "Reptiles").
            commonName: The common name of the species (e.g., "American Robin").
            scientificName: The scientific name of the species (e.g., "Turdus migratorius").
            info: A brief description of the species, including notable traits, habitat, and any interesting facts.

            Example Output:
                        {
                        "category": "Bird",
                        "commonName": "American Robin",
                        "scientificName": "Turdus migratorius",
                        "info": "The American Robin is a migratory songbird native to North America. Known for its orange-red breast, it is a common sight in gardens and parks during spring and summer."
                        }
            Please do not add any string/detials like json in the output 🙏🏽 It is breaking my application!!!  Please Please give output in well formatted json {} only.
`,
          },
          {
            type: 'image_url',
            image_url: {
              url: signedUrl,
            },
          },
        ],
      },
    ],
    max_tokens: 300,
  });

  const gptResponse = completion.choices[0].message.content;

  await publishToTopic(userSub, gptResponse, key);
  await storeToDynamoDB(userSub, key, gptResponse);

  const response = {
    statusCode: 200,
    body: JSON.stringify('Hello from Lambda!'),
  };
  return response;
};
