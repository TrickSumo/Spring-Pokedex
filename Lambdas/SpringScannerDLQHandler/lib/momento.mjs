import {
    TopicClient, TopicConfigurations, CredentialProvider
} from "@gomomento/sdk";
import { Logger } from '@aws-lambda-powertools/logger';

const PUBSUB_CACHE_NAME = 'publish-subscribe-cache';

let topicClient;

const logger = new Logger({ serviceName: 'shareScan-lambda' });

export const initTopicClient = async (apiKey) => {
    if (!topicClient) {
        logger.info('Initializing Momento topic client');
        topicClient = new TopicClient({
            configuration: TopicConfigurations.Lambda.latest(),
            credentialProvider: CredentialProvider.fromString(apiKey)
        });
        logger.info('Initialized Momento topic client');
    }
}

export const publishToTopic = async (userSub, key) => {
    const topicName = userSub;
    const type = "ProcessingFailure";
    const message = JSON.stringify({ key, type });
    await topicClient.publish(PUBSUB_CACHE_NAME, topicName, message);
}