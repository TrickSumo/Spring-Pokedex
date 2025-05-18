import { getSignedUrl } from '@aws-sdk/cloudfront-signer';

const intervalToAddInMilliseconds = 86400 * 1000; // 24 hours in milliseconds

export const generateSignedUrl = async (s3ObjectKey, cloudfrontDistributionDomain, keyPairId, privateKey) => {
    const url = `${cloudfrontDistributionDomain}/${s3ObjectKey}`;
    const policy = {
        Statement: [
            {
                Resource: url,
                Condition: {
                    DateLessThan: {
                        "AWS:EpochTime": Math.floor((Date.now() + intervalToAddInMilliseconds) / 1000),
                    },
                },
            },
        ],
    };

    const policyString = JSON.stringify(policy);
    const signedUrl = getSignedUrl({
        keyPairId,
        privateKey,
        policy: policyString,
    });

    return signedUrl;
};
