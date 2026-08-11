import { Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { AuthenticatedRequest, JWTPayload } from '../types/order.types';
import { AppError } from './error.middleware';

export const authenticateJWT = (
  req: AuthenticatedRequest,
  _res: Response,
  next: NextFunction
): void => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next(new AppError('Authentication token is missing or invalid', 401));
  }

  const token = authHeader.split(' ')[1];

  try {
    const payload = jwt.verify(token, env.JWT_SECRET) as JWTPayload;
    req.user = payload;
    next();
  } catch (error) {
    return next(new AppError('Invalid or expired authentication token', 401));
  }
};

export const authorizeRoles = (...roles: ('USER' | 'ADMIN')[]) => {
  return (req: AuthenticatedRequest, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      return next(new AppError('User not authenticated', 401));
    }

    if (!roles.includes(req.user.role)) {
      return next(new AppError('Access forbidden: Insufficient permissions', 403));
    }

    next();
  };
};
