import Redis from 'ioredis';
import { env } from './env';

export const redisSubscriber = new Redis({
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

redisSubscriber.on('connect', () => {
  console.log('✅ notification-service connected to Redis Pub/Sub');
});

redisSubscriber.on('error', (err: Error) => {
  if (process.env.NODE_ENV !== 'test') {
    console.error('⚠️ notification-service Redis error:', err.message);
  }
});
