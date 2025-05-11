import { getSignedCookies } from "@aws-sdk/cloudfront-signer";

const privateKeyRaw = process.env.privateKey;
const privateKey = privateKeyRaw.replace(/\\n/g, '\n');

const cloudfrontDistributionDomain = process.env.cloudfrontDistributionDomain;
const keyPairId = process.env.keyPairId;
const intervalToAddInMilliseconds = 86400 * 1000; // 24 hours in milliseconds 


export const handler = async (event) => {

    if (!privateKey) {
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'privateKeyy not set in environment variables' }),
        };
    }

    const claims = event.requestContext?.authorizer?.claims;
    const userSub = claims?.sub;

    const s3ObjectKey = `${userSub}/*`;
    const url = `${cloudfrontDistributionDomain}/${s3ObjectKey}`;


    const policy = {
        Statement: [
            {
                "Resource": url,
                Condition: {
                    DateLessThan: {
                        "AWS:EpochTime": Math.floor((Date.now() + intervalToAddInMilliseconds) / 1000),
                    },
                },
            },
        ],
    };
    const policyString = JSON.stringify(policy);


    const cookies = getSignedCookies({
        keyPairId,
        privateKey,
        policy: policyString,
    });

    return {
        statusCode: 200,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(cookies),
    };

};
