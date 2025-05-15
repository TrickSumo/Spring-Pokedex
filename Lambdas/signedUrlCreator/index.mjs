import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const s3 = new S3Client();

async function generateUploadUrl(filename, contentType, userSub) {
    console.log("inside 123", filename, contentType);
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

    const claims = event.requestContext?.authorizer?.claims;
    const userSub = claims?.sub;

    console.log(event.body);
    const url = await generateUploadUrl(filename, contentType, userSub);
    return {
        statusCode: 200,
        body: JSON.stringify({ url }),
    };
};