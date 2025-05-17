import { DynamoDBDocumentClient, GetCommand, ScanCommand } from "@aws-sdk/lib-dynamodb";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { getSignedUrl } from '@aws-sdk/cloudfront-signer';
import {
    AuthClient,
    CredentialProvider,
    CacheClient,
} from '@gomomento/sdk';
import { randomUUID } from 'crypto'

const apiKey = process.env.MOMENTO_API_KEY;

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

const tableName = process.env.tableName || "SpringPokedex";

const privateKeyRaw = process.env.privateKey;
const privateKey = privateKeyRaw.replace(/\\n/g, '\n');
const cloudfrontDistributionDomain = process.env.cloudfrontDistributionDomain;
const keyPairId = process.env.keyPairId;
const intervalToAddInMilliseconds = 86400 * 1000; // 24 hours in milliseconds

const SHARED_CACHE_NAME = 'shared-cache';
const disposableTokenValidity = 86400; // in minutes - 24 hours
const cacheClient = await CacheClient.create({
    credentialProvider: CredentialProvider.fromString(apiKey),
    defaultTtlSeconds: 86400, // 24 hours
});

async function updateCache(cacheId,cacheData) {
    const res = await cacheClient.dictionarySetField(SHARED_CACHE_NAME, cacheId, 'data', cacheData);
    return res.is_success
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
  

const getDynamoDBItem = async (userId,scanId) => {
    const params = {
        TableName: tableName,
        Key: {
            userId,scanId
        },
    };

    const command = new GetCommand(params);
    const response = await docClient.send(command);
    return response.Item;
};

export const handler = async (event) => {

    const userSub = event?.requestContext?.authorizer?.jwt?.claims?.sub;
    const {scanId} = JSON.parse(event.body);

    console.log(userSub, event.body);

    const item = await getDynamoDBItem(userSub, scanId);
    const signedUrl = await generateSignedUrl(scanId);
    
    const cacheData = JSON.stringify({item, signedUrl});
    const cacheId =  randomUUID();

    const cacheRes = await updateCache(cacheId, cacheData);

    return {
        statusCode: 200,
        headers: { "Content-Type": "application/json"},

        body: JSON.stringify({shareId:cacheId, shareStatus:cacheRes}),
    };
    
};