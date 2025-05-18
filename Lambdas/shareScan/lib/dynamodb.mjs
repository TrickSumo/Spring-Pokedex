import { DynamoDBDocumentClient, GetCommand } from "@aws-sdk/lib-dynamodb";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";

const tableName = process.env.tableName || "SpringPokedex";

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

export const getDynamoDBItem = async (userId, scanId) => {
    const params = {
        TableName: tableName,
        Key: {
            userId, scanId
        },
    };

    const command = new GetCommand(params);
    const response = await docClient.send(command);
    return response.Item;
};