
import middy from '@middy/core'
import ssm from '@middy/ssm';
import { initAuthClient, createDisposableToken } from './lib/momento.mjs';

const createResponse = (statusCode, body) => {
  const responseBody = JSON.stringify(body);
  return {
    statusCode,
    headers: { "Content-Type": "application/json" },
    body: responseBody,
  };
};

export const lambdaHandler = async (event, context) => {
  await initAuthClient(context.MOMENTO_API_KEY);

  try {
    const userSub = event?.requestContext?.authorizer?.jwt?.claims?.sub;
    const momentoToken = await createDisposableToken(userSub);
    return createResponse(200, momentoToken);
  }
  catch (err) {
    return createResponse(500, { error: 'Failed to generate token' });
  }

};

export const handler = middy()
  .use(
    ssm({
      fetchData: {
        MOMENTO_API_KEY: process.env.MOMENTO_API_KEY_PARAM_NAME
      },
      setToContext: true,
      cache: true,
      cacheExpiry: 5 * 60 * 1000,
    })
  )
  .handler(lambdaHandler)