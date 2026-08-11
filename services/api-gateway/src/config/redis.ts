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
  console.log('✅ API Gateway connected to Redis server');
});

redisClient.on('error', (err: Error) => {
  if (process.env.NODE_ENV !== 'test') {
    console.error('⚠️ API Gateway Redis error:', err.message);
  }
});

export const connectRedis = async (): Promise<void> => {
  try {
    if (redisClient.status === 'wait') {
      await redisClient.connect();
    }
  } catch (error) {
    if (process.env.NODE_ENV !== 'test') {
      console.error('⚠️ Could not connect API Gateway to Redis:', error);
    }
  }
};
