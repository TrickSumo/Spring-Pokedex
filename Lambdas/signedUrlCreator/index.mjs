
import middy from '@middy/core'
import ssm from '@middy/ssm';
import { initCacheClient, isLimitExceeded } from './lib/momento.mjs';
import { generateUploadUrl } from './lib/s3.mjs';

const createResponse = (statusCode, body) => {
    const responseBody = JSON.stringify(body);
    return {
        statusCode,
        headers: { "Content-Type": "application/json" },
        body: responseBody,
    };
};


export const lambdaHandler = async (event, context) => {

    await initCacheClient(context.MOMENTO_API_KEY);

    const { filename, contentType } = JSON.parse(event.body);
    const allowedTypes = ["image/jpeg", "image/png"];
    if (!allowedTypes.includes(contentType)) {
        return createResponse(400, { error: "Invalid content type" });
    }

    try {
        const userSub = event?.requestContext?.authorizer?.jwt?.claims?.sub;

        const blocked = await isLimitExceeded(userSub);
        if (blocked) return createResponse(429, { error: "Daily upload limit reached. Try again tomorrow." });

        const url = await generateUploadUrl(filename, contentType, userSub);
        return createResponse(200, { url });
    }
    catch (error) {
        console.error('Error generating upload URL:', error);
        return createResponse(500, { error: 'Failed to generate upload URL' });
    }
};


export const handler = middy()
    .use(
        ssm({
            fetchData: {
                MOMENTO_API_KEY: process.env.MOMENTO_API_KEY_PARAM_NAME,
            },
            setToContext: true,
            cache: true,
            cacheExpiry: 5 * 60 * 1000,
        })
    )
    .handler(lambdaHandler)