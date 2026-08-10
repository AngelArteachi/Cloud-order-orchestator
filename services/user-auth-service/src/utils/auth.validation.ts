import { z } from 'zod';

export const registerSchema = z.object({
  email: z
    .string({ required_error: 'Email is required' })
    .email('Invalid email format'),
  password: z
    .string({ required_error: 'Password is required' })
    .min(6, 'Password must be at least 6 characters long'),
  name: z
    .string({ required_error: 'Name is required' })
    .min(2, 'Name must be at least 2 characters long'),
  role: z.enum(['USER', 'ADMIN']).optional().default('USER'),
});

export const loginSchema = z.object({
  email: z
    .string({ required_error: 'Email is required' })
    .email('Invalid email format'),
  password: z
    .string({ required_error: 'Password is required' })
    .min(1, 'Password cannot be empty'),
});

export type RegisterSchema = z.infer<typeof registerSchema>;
export type LoginSchema = z.infer<typeof loginSchema>;
