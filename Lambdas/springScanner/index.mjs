

import middy from '@middy/core'
import ssm from '@middy/ssm';
import { initTopicClient, publishSuccessToTopic, publishFailureToTopic } from './lib/momento.mjs';
import { storeToDynamoDB } from './lib/dynamo.mjs';
import { createChatCompletion, initOpenAI } from './lib/openai.mjs';
import { generateSignedUrl } from './lib/cloudfront.mjs';
import { logger } from './lib/logger.mjs';


export const lambdaHandler = async (event, context) => {

  await initTopicClient(context.MOMENTO_API_KEY);
  await initOpenAI(context.OPENAI_API_KEY);

  const cloudfrontDistributionDomain = context.CLOUDFRONT_DISTRIBUTION_DOMAIN;
  const keyPairId = context.CLOUDFRONT_KEY_PAIR_ID;
  const privateKeyRaw = context.CLOUDFRONT_PRIVATE_KEY;
  const privateKey = privateKeyRaw.replace(/\\n/g, '\n');

  const key = decodeURIComponent(
    event.Records[0].s3.object.key.replace(/\+/g, ' ')
  );
  const userSub = key.split('/')[1]; // Extract userSub from the key - images are uploaded at /images/userSub/imageName

  try {
    logger.info('SpringScanner lambda handler invoked', { key });
    const signedUrl = await generateSignedUrl(key, cloudfrontDistributionDomain, keyPairId, privateKey);
    const completion = await createChatCompletion(signedUrl)

    const gptResponse = completion.choices[0].message.content;

    await publishSuccessToTopic(userSub, gptResponse, key);
    await storeToDynamoDB(userSub, key, gptResponse);
    logger.info('SpringScanner lambda handler completed', { key });
  }
  catch (err) {
    await publishFailureToTopic(userSub, key);
    logger.error('Error in springScanner lambda handler', err);
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
        OPENAI_API_KEY: process.env.OPENAI_API_KEY_PARAM_NAME,
      },
      setToContext: true,
      cache: true,
      cacheExpiry: 5 * 60 * 1000,
    })
  )
  .handler(lambdaHandler)