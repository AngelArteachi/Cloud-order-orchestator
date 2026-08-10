import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { JWTPayload } from '../types/user.types';

export const generateToken = (payload: Omit<JWTPayload, 'iat' | 'exp'>): string => {
  return jwt.sign(payload, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN as jwt.SignOptions['expiresIn'],
  });
};

export const verifyToken = (token: string): JWTPayload => {
  return jwt.verify(token, env.JWT_SECRET) as JWTPayload;
};
