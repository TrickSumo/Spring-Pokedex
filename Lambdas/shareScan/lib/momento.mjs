
import {
    CredentialProvider,
    CacheClient,
    Configurations,
} from '@gomomento/sdk';
import { Logger } from '@aws-lambda-powertools/logger';

const logger = new Logger({ serviceName: 'shareScan-lambda' });
const SHARED_CACHE_NAME = 'shared-cache';

let cacheClient;

export const initCacheClient = async (apiKey) => {
    if (!cacheClient) {
        logger.info('Initializing Momento cache client');
        cacheClient = await CacheClient.create({
            configuration: Configurations.Lambda.latest(),
            credentialProvider: CredentialProvider.fromString(apiKey),
            defaultTtlSeconds: 86400, // 24 hours
        });
        logger.info('Initialized Momento cache client');
    }
}

export const updateCache = async (cacheId, cacheData) => {
    const res = await cacheClient.dictionarySetField(SHARED_CACHE_NAME, cacheId, 'data', cacheData);
    if (!res.is_success) throw new Error(`Failed to update cache: ${res.error}`);
}

