import rateLimit from 'express-rate-limit';
import RedisStore from 'rate-limit-redis';
import { redisClient } from '../config/redis';
import { env } from '../config/env';

export const globalRateLimiter = rateLimit({
  windowMs: env.RATE_LIMIT_WINDOW_MS,
  max: env.RATE_LIMIT_MAX_REQUESTS,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    status: 'error',
    message: 'Too many requests from this IP, please try again after 15 minutes',
  },
  store: process.env.NODE_ENV === 'test'
    ? undefined
    : new RedisStore({
        // @ts-expect-error - ioredis sendCommand compatibility
        sendCommand: (...args: string[]) => redisClient.call(...args),
      }),
});
