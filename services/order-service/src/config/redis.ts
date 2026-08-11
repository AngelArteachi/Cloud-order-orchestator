import Redis from 'ioredis';
import { env } from './env';

export const redisClient = new Redis({
  host: env.REDIS_HOST,
  port: env.REDIS_PORT,
  lazyConnect: true,
  retryStrategy(times: number) {
    const delay = Math.min(times * 100, 3000);
    return delay;
  },
});

redisClient.on('connect', () => {
  console.log('✅ Connected to Redis server');
});

redisClient.on('error', (err: Error) => {
  console.error('⚠️ Redis error:', err.message);
});

export const connectRedis = async (): Promise<void> => {
  try {
    if (redisClient.status === 'wait') {
      await redisClient.connect();
    }
  } catch (error) {
    console.error('⚠️ Could not connect to Redis, operating in fallback mode:', error);
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
  } catch (error) {
    console.error('⚠️ Redis setCache error:', error);
  }
};

export const deleteCache = async (key: string): Promise<void> => {
  try {
    await redisClient.del(key);
  } catch (error) {
    console.error('⚠️ Redis deleteCache error:', error);
  }
};

export const deleteCachePattern = async (pattern: string): Promise<void> => {
  try {
    const keys = await redisClient.keys(pattern);
    if (keys.length > 0) {
      await redisClient.del(...keys);
    }
  } catch (error) {
    console.error('⚠️ Redis deleteCachePattern error:', error);
  }
};
