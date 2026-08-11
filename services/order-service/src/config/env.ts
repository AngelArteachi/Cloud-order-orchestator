import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const envSchema = z.object({
  PORT: z.string().default('3002').transform((val) => parseInt(val, 10)),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  MONGO_URI: z
    .string()
    .default('mongodb://admin:mongo_secret@localhost:27017/orders_db?authSource=admin'),
  REDIS_HOST: z.string().default('localhost'),
  REDIS_PORT: z.string().default('6379').transform((val) => parseInt(val, 10)),
  JWT_SECRET: z
    .string()
    .min(16, 'JWT_SECRET must be at least 16 characters long')
    .default('super_secret_jwt_key_change_in_production_32chars'),
});

const _env = envSchema.safeParse(process.env);

if (!_env.success) {
  console.error('❌ Invalid environment variables in order-service:', _env.error.format());
  throw new Error('Invalid environment variables in order-service');
}

export const env = _env.data;
