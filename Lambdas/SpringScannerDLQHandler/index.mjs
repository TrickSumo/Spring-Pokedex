import {
    TopicClient, TopicConfigurations, CredentialProvider
} from "@gomomento/sdk";

const apiKey = process.env.MOMENTO_API_KEY;
const PUBSUB_CACHE_NAME = 'publish-subscribe-cache';
const topicClient = new TopicClient({
    configuration: TopicConfigurations.Lambda.latest(),
    credentialProvider: CredentialProvider.fromString(apiKey)
});

const publishToTopic = async (userSub, key) => {
    const topicName = userSub;
    const type = "ProcessingFailure";
    const message = JSON.stringify({ key, type });
    await topicClient.publish(PUBSUB_CACHE_NAME, topicName, message);
}

export const handler = async (event) => {
    console.log(event);
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
