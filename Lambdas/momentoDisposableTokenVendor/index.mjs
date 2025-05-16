import {
  AuthClient,
  DisposableTokenScopes,
  ExpiresIn,
  CredentialProvider,
} from '@gomomento/sdk';

const apiKey = process.env.MOMENTO_API_KEY;
const authClient = new AuthClient({
  credentialProvider: CredentialProvider.fromString(apiKey)
});
const PUBSUB_CACHE_NAME = 'publish-subscribe-cache';
const SHARED_CACHE_NAME = 'shared-cache';

const disposableTokenValidity = 30; // minutes


async function createDisposableToken(id, userSub) {

  if (!id) { return null; }

  if (id === "topic") {
    const TOPIC_NAME = userSub;
    const scope = DisposableTokenScopes.topicSubscribeOnly(
      PUBSUB_CACHE_NAME,
      TOPIC_NAME
    );
    const tokenResponse = await authClient.generateDisposableToken(
      scope,
      ExpiresIn.minutes(disposableTokenValidity)
    );
    return tokenResponse;
  }
  else {
    const scope = DisposableTokenScopes.cacheReadOnly(
      SHARED_CACHE_NAME
    );
    const tokenResponse = await authClient.generateDisposableToken(
      scope,
      ExpiresIn.minutes(disposableTokenValidity)
    );
    return tokenResponse;
  }
}


export const handler = async (event) => {

  const userSub = event?.requestContext?.authorizer?.jwt?.claims?.sub;
  const { pathParameters } = event;
  const id = pathParameters?.id;

  console.log(`Received event: ${JSON.stringify(event)}`, userSub, id);

  const momentoToken = await createDisposableToken(id, userSub);
  return {
    statusCode: 200,
    body: JSON.stringify({ momentoToken }),
  };
};