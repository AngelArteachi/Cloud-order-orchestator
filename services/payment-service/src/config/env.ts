import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const envSchema = z.object({
  PORT: z.string().default('3004').transform((val) => parseInt(val, 10)),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  ORDER_SERVICE_URL: z.string().default('http://localhost:3002'),
  WEBHOOK_SECRET: z.string().default('super_secret_webhook_signing_key_32chars'),
});

const _env = envSchema.safeParse(process.env);

if (!_env.success) {
  console.error('❌ Invalid environment variables in payment-service:', _env.error.format());
  throw new Error('Invalid environment variables in payment-service');
}

export const env = _env.data;
