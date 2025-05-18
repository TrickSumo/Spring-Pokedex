
import middy from '@middy/core'
import ssm from '@middy/ssm';
import { initTopicClient, publishToTopic } from './lib/momento.mjs';

export const lambdaHandler = async (event, context) => {

    await initTopicClient(context.MOMENTO_API_KEY);

    for (const record of event.Records) {
        try {
            const messageBody = JSON.parse(record.body);
            const objectKey = messageBody.Records[0].s3.object.key;
            const userSub = objectKey.split('/')[1];
            await publishToTopic(userSub, objectKey);
        } catch (error) {
            console.error("Error processing message:", error);
            throw error;
        }
    }
    return;
};

export const handler = middy()
  .use(
    ssm({
      fetchData: {
        MOMENTO_API_KEY: process.env.MOMENTO_API_KEY_PARAM_NAME,
      },
      setToContext: true,
      cache: true,
      cacheExpiry: 5 * 60 * 1000,
    })
  )
  .handler(lambdaHandler)