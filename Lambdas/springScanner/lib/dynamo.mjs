import { DynamoDBDocumentClient, PutCommand } from "@aws-sdk/lib-dynamodb";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { logger } from "./logger.mjs";

const tableName = process.env.tableName || "SpringPokedex";
const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

export const storeToDynamoDB = async (userId, scanId, gptResponse) => {
    try {
        const command = new PutCommand({
            TableName: tableName,
            Item: {
                userId,
                scanId,
                gptResponse,
                date: (new Date()).toISOString().split('T')[0]
            }
        });

        const response = await docClient.send(command);
    }
    catch (err) {
        logger.error('Error storing to DynamoDB', err);
    }
}