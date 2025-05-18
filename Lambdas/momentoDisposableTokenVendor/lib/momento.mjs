import {
    AuthClient,
    ExpiresIn,
    CredentialProvider,
} from '@gomomento/sdk';
import { Logger } from '@aws-lambda-powertools/logger';

const logger = new Logger({ serviceName: 'disposable-token-lambda' });
const PUBSUB_CACHE_NAME = 'publish-subscribe-cache';
const SHARED_CACHE_NAME = 'shared-cache';

const disposableTokenValidity = 60; // minutes

let authClient;

export const initAuthClient = async (apiKey) => {
    if (!authClient) {
        logger.info('Initializing Momento auth client');

        authClient = new AuthClient({
            credentialProvider: CredentialProvider.fromString(apiKey)
        });

        logger.info('Initialized Momento auth client');
    }
};

export const createDisposableToken = async (userSub) => {
    logger.info('Creating disposable token for user:', userSub);
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