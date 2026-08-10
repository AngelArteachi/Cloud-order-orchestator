import bcrypt from 'bcryptjs';
import { env } from '../config/env';

export const hashPassword = async (password: string): Promise<string> => {
  const salt = await bcrypt.genSalt(env.BCRYPT_SALT_ROUNDS);
  return bcrypt.hash(password, salt);
};

export const comparePassword = async (password: string, hashedPassword: string): Promise<boolean> => {
  return bcrypt.compare(password, hashedPassword);
};
