
import middy from '@middy/core'
import ssm from '@middy/ssm';
import { randomUUID } from 'crypto'
import { getDynamoDBItem } from './lib/dynamodb.mjs';
import { generateSignedUrl } from './lib/cloudfront.mjs';
import { initCacheClient, updateCache } from './lib/momento.mjs';

const createResponse = (statusCode, body) => {
  const responseBody = JSON.stringify(body);
  return {
    statusCode,
    headers: { "Content-Type": "application/json" },
    body: responseBody,
  };
};

export const lambdaHandler = async (event, context) => {

  await initCacheClient(context.MOMENTO_API_KEY);

  const cloudfrontDistributionDomain = context.CLOUDFRONT_DISTRIBUTION_DOMAIN;
  const keyPairId = context.CLOUDFRONT_KEY_PAIR_ID;
  const privateKeyRaw = context.CLOUDFRONT_PRIVATE_KEY;
  const privateKey = privateKeyRaw.replace(/\\n/g, '\n');

  try {
    const userSub = event?.requestContext?.authorizer?.jwt?.claims?.sub;
    const { scanId } = JSON.parse(event.body);

    const item = await getDynamoDBItem(userSub, scanId);
    const signedUrl = await generateSignedUrl(scanId, cloudfrontDistributionDomain, keyPairId, privateKey);

    const cacheData = JSON.stringify({ item, signedUrl });
    const cacheId = randomUUID();

    const cacheRes = await updateCache(cacheId, cacheData);
    return createResponse(200, { shareId: cacheId, shareStatus: cacheRes });
  }
  catch (err) {
    console.error(err);
    return createResponse(500, { error: 'Failed to share scan!' });
  }
};


export const handler = middy()
  .use(
    ssm({
      fetchData: {
        MOMENTO_API_KEY: process.env.MOMENTO_API_KEY_PARAM_NAME,
        CLOUDFRONT_DISTRIBUTION_DOMAIN: process.env.CLOUDFRONT_DISTRIBUTION_DOMAIN_PARAM_NAME,
        CLOUDFRONT_KEY_PAIR_ID: process.env.CLOUDFRONT_KEY_PAIR_ID_PARAM_NAME,
        CLOUDFRONT_PRIVATE_KEY: process.env.CLOUDFRONT_PRIVATE_KEY_PARAM_NAME,
      },
      setToContext: true,
      cache: true,
      cacheExpiry: 5 * 60 * 1000,
    })
  )
  .handler(lambdaHandler)