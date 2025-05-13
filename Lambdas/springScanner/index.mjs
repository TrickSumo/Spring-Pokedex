import OpenAI from 'openai';
const openai = new OpenAI({ apiKey: process.env.openaiAPIKey });
import { getSignedUrl } from '@aws-sdk/cloudfront-signer';

const privateKeyRaw = process.env.privateKey;
const privateKey = privateKeyRaw.replace(/\\n/g, '\n');

const cloudfrontDistributionDomain = process.env.cloudfrontDistributionDomain;
const keyPairId = process.env.keyPairId;
const intervalToAddInMilliseconds = 86400 * 1000; // 24 hours in milliseconds

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
  const signedUrl = await generateSignedUrl(key);

  const completion = await openai.chat.completions.create({
    model: 'gpt-4.1', // use correct model
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'text',
            text: `
            Identify the species in this image for a Pokédex-like application. Please output the result in JSON format containing the following fields: commonName, scientificName, and info.

            commonName: The common name of the species (e.g., "American Robin").
            scientificName: The scientific name of the species (e.g., "Turdus migratorius").
            info: A brief description of the species, including notable traits, habitat, and any interesting facts.

            Example Output:
                        {
                        "commonName": "American Robin",
                        "scientificName": "Turdus migratorius",
                        "info": "The American Robin is a migratory songbird native to North America. Known for its orange-red breast, it is a common sight in gardens and parks during spring and summer."
                        }
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

  console.log(completion.choices[0].message.content);

  const response = {
    statusCode: 200,
    body: JSON.stringify('Hello from Lambda!'),
  };
  return response;
};
