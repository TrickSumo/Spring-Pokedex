import {
    TopicClient, TopicConfigurations, CredentialProvider
} from "@gomomento/sdk";
import { logger } from "./logger.mjs";

const PUBSUB_CACHE_NAME = 'publish-subscribe-cache';

let topicClient;

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

export const publishSuccessToTopic = async (userSub, gptResponse, key) => {
  const topicName = userSub;
  const type = "ProcessingSuccess";
  const message = JSON.stringify({ gptResponse, key, type });
  await topicClient.publish(PUBSUB_CACHE_NAME, topicName, message);
}

export const publishFailureToTopic = async (userSub, key) => {
    const topicName = userSub;
    const type = "ProcessingFailure";
    const message = JSON.stringify({ key, type });
    await topicClient.publish(PUBSUB_CACHE_NAME, topicName, message);
}