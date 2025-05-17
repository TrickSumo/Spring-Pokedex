import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import {
    CacheClient,
    CacheIncrementResponse,
    Configurations,
    CredentialProvider,
} from "@gomomento/sdk";

const apiKey = process.env.MOMENTO_API_KEY

const RATE_LIMIT_CACHE_NAME = 'cache';
const DAILY_LIMIT = 6;

const s3 = new S3Client();

const cacheClient = await CacheClient.create({
    configuration: Configurations.Lambda.latest(),
    credentialProvider: CredentialProvider.fromString(apiKey),
    defaultTtlSeconds: Math.floor(getTTLUntilMidnightUTC() / 1000), // 24 hours
});

function getTodayKey(userSub) {
    const today = new Date().toISOString().slice(0, 10); // e.g., '2025-05-17'
    console.log(`upload-count-${userSub}-${today}`);
    return `upload-count-${userSub}-${today}`;
}

function getTTLUntilMidnightUTC() {
    const now = new Date();
    const tomorrow = new Date(Date.UTC(
        now.getUTCFullYear(),
        now.getUTCMonth(),
        now.getUTCDate() + 1
    ));
    return tomorrow.getTime() - now.getTime(); // in milliseconds
}

async function isLimitExceeded(userSub) {
    const key = getTodayKey(userSub);
    const resp = await cacheClient.increment(RATE_LIMIT_CACHE_NAME, key);

    if (resp.type === CacheIncrementResponse.Success) {
        return resp.value() > DAILY_LIMIT;
    }

    return true; // fail safe: block on error
}

async function generateUploadUrl(filename, contentType, userSub) {
    console.log("inside 123", filename, contentType, userSub);
    const bucketName = "springapp-severless-360";
    const key = `images/${userSub}/${filename}`;

    const command = new PutObjectCommand({
        Bucket: bucketName,
        Key: key,
        ContentType: contentType,
    });

    const url = await getSignedUrl(s3, command, { expiresIn: 360 }); // 1 hour expiry
    return url;
}


export const handler = async (event) => {
    const { filename, contentType } = JSON.parse(event.body);
    const allowedTypes = ["image/jpeg", "image/png"];
    if (!allowedTypes.includes(contentType)) {
        return {
            statusCode: 400,
            body: JSON.stringify({ error: "Invalid content type" }),
        };
    }

    const userSub = event?.requestContext?.authorizer?.jwt?.claims?.sub;

    const blocked = await isLimitExceeded(userSub);
    if (blocked) {
        return {
            statusCode: 429,
            body: JSON.stringify({ error: "Daily upload limit (3) reached. Try again tomorrow." }),
        };
    }

    const url = await generateUploadUrl(filename, contentType, userSub);
    return {
        statusCode: 200,
        body: JSON.stringify({ url }),
    };
};