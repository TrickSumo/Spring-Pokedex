import {
    CacheClient,
    CacheIncrementResponse,
    Configurations,
    CredentialProvider,
} from "@gomomento/sdk";
import { Logger } from '@aws-lambda-powertools/logger';

const logger = new Logger({ serviceName: 'shareScan-lambda' });

let cacheClient;

const RATE_LIMIT_CACHE_NAME = 'cache';
const DAILY_LIMIT = 6;

export const initCacheClient = async (apiKey) => {
    if (!cacheClient) {
        logger.info('Initializing Momento cache client');
        cacheClient = await CacheClient.create({
            configuration: Configurations.Lambda.latest(),
            credentialProvider: CredentialProvider.fromString(apiKey),
            defaultTtlSeconds: Math.floor(getTTLUntilMidnightUTC() / 1000), // 24 hours
        });
        logger.info('Initialized Momento cache client');
    }
}

const getTodayKey = (userSub) => {
    const today = new Date().toISOString().slice(0, 10); // e.g., '2025-05-17'
    return `upload-count-${userSub}-${today}`;
}

const getTTLUntilMidnightUTC = () => {
    const now = new Date();
    const tomorrow = new Date(Date.UTC(
        now.getUTCFullYear(),
        now.getUTCMonth(),
        now.getUTCDate() + 1
    ));
    return tomorrow.getTime() - now.getTime(); // in milliseconds
}

export const isLimitExceeded = async (userSub) => {
    try {
        const key = getTodayKey(userSub);
        const resp = await cacheClient.increment(RATE_LIMIT_CACHE_NAME, key);
        await cacheClient.updateTtl(RATE_LIMIT_CACHE_NAME, key, getTTLUntilMidnightUTC());

        if (resp.type === CacheIncrementResponse.Success) {
            return resp.value() > DAILY_LIMIT;
        }
        return true;
    }
    catch (error) {
        logger.error(`Error checking limit: ${error}`);
        return true;
    }
}