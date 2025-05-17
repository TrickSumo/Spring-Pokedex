import {
  AuthClient,
  ExpiresIn,
  CredentialProvider,
} from '@gomomento/sdk';

const apiKey = process.env.MOMENTO_API_KEY;
const authClient = new AuthClient({
  credentialProvider: CredentialProvider.fromString(apiKey)
});
const PUBSUB_CACHE_NAME = 'publish-subscribe-cache';
const SHARED_CACHE_NAME = 'shared-cache';

const disposableTokenValidity = 60; // minutes

async function createDisposableToken(userSub) {
  const TOPIC_NAME = userSub;
  const scopes = {
    "permissions":
      [
        { "role": "subscribeonly", "cache": PUBSUB_CACHE_NAME, "topic": TOPIC_NAME },
        { "role": "readonly", "cache": SHARED_CACHE_NAME }
      ]
  };
  const tokenResponse = await authClient.generateDisposableToken(
    scopes,
    ExpiresIn.minutes(disposableTokenValidity)
  );
  return tokenResponse;
}

export const handler = async (event) => {
  const userSub = event?.requestContext?.authorizer?.jwt?.claims?.sub;
  const momentoToken = await createDisposableToken(userSub);
  return {
    statusCode: 200,
    body: JSON.stringify({ momentoToken }),
  };
};