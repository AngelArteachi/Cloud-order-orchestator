import { Request } from 'express';

export type UserRole = 'USER' | 'ADMIN';

export interface UserEntity {
  id: string;
  email: string;
  password: string;
  name: string;
  role: UserRole;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserResponse {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  createdAt: Date;
  updatedAt: Date;
}

export interface RegisterInput {
  email: string;
  password: string;
  name: string;
  role?: UserRole;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface AuthResponse {
  user: UserResponse;
  token: string;
}

export interface JWTPayload {
  userId: string;
  email: string;
  role: UserRole;
  iat?: number;
  exp?: number;
}

export interface AuthenticatedRequest extends Request {
  user?: JWTPayload;
}
