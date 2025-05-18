import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const bucketName = "springapp-severless-360";

const s3 = new S3Client();

export const generateUploadUrl = async (filename, contentType, userSub) => {

    const key = `images/${userSub}/${filename}`;

    const command = new PutObjectCommand({
        Bucket: bucketName,
        Key: key,
        ContentType: contentType,
    });

    const url = await getSignedUrl(s3, command, { expiresIn: 360 }); // 1 hour expiry
    return url;
}
