import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const envSchema = z.object({
  PORT: z.string().default('3001').transform((val) => parseInt(val, 10)),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  DATABASE_URL: z
    .string()
    .default('postgresql://postgres:postgres_secret@localhost:5432/auth_db?schema=public'),
  JWT_SECRET: z
    .string()
    .min(16, 'JWT_SECRET must be at least 16 characters long')
    .default('super_secret_jwt_key_change_in_production_32chars'),
  JWT_EXPIRES_IN: z.string().default('1h'),
  BCRYPT_SALT_ROUNDS: z.string().default('10').transform((val) => parseInt(val, 10)),
});

const _env = envSchema.safeParse(process.env);

if (!_env.success) {
  console.error('❌ Invalid environment variables:', _env.error.format());
  throw new Error('Invalid environment variables');
}

export const env = _env.data;
