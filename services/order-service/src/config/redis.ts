import Redis from 'ioredis';
import { env } from './env';

export const redisClient = new Redis({
  host: env.REDIS_HOST,
  port: env.REDIS_PORT,
  lazyConnect: true,
  enableOfflineQueue: process.env.NODE_ENV !== 'test',
  maxRetriesPerRequest: process.env.NODE_ENV === 'test' ? 0 : 20,
  retryStrategy(times: number) {
    if (process.env.NODE_ENV === 'test') {
      return null;
    }
    const delay = Math.min(times * 100, 3000);
    return delay;
  },
});

redisClient.on('connect', () => {
  console.log('✅ Connected to Redis server');
});

redisClient.on('error', (err: Error) => {
  if (process.env.NODE_ENV !== 'test') {
    console.error('⚠️ Redis error:', err.message);
  }
});

export const connectRedis = async (): Promise<void> => {
  try {
    if (redisClient.status === 'wait') {
      await redisClient.connect();
    }
  } catch (error) {
    if (process.env.NODE_ENV !== 'test') {
      console.error('⚠️ Could not connect to Redis, operating in fallback mode:', error);
    }
  }
};

export const getCache = async <T>(key: string): Promise<T | null> => {
  try {
    const data = await redisClient.get(key);
    return data ? JSON.parse(data) : null;
  } catch {
    return null;
  }
};

export const setCache = async (key: string, data: unknown, ttlSeconds = 300): Promise<void> => {
  try {
    await redisClient.set(key, JSON.stringify(data), 'EX', ttlSeconds);
  } catch {
    // Ignore cache failure and fallback to DB
  }
};

export const deleteCache = async (key: string): Promise<void> => {
  try {
    await redisClient.del(key);
  } catch {
    // Ignore cache deletion failure in test/offline mode
  }
};

export const deleteCachePattern = async (pattern: string): Promise<void> => {
  try {
    const keys = await redisClient.keys(pattern);
    if (keys.length > 0) {
      await redisClient.del(...keys);
    }
  } catch {
    // Ignore cache deletion pattern failure in test/offline mode
  }
};

export const publishEvent = async (channel: string, message: unknown): Promise<void> => {
  try {
    await redisClient.publish(channel, JSON.stringify(message));
  } catch {
    // Ignore Pub/Sub publish errors during test/offline mode
  }
};
