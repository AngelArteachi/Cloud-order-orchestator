import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/auth.service';
import { AuthenticatedRequest } from '../types/user.types';
import { AppError } from '../middlewares/error.middleware';

export class AuthController {
  constructor(private authService: AuthService = new AuthService()) {}

  register = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await this.authService.register(req.body);
      res.status(201).json({
        status: 'success',
        message: 'User registered successfully',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };

  login = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await this.authService.login(req.body);
      res.status(200).json({
        status: 'success',
        message: 'Logged in successfully',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };

  getMe = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        throw new AppError('Unauthorized', 401);
      }
      const user = await this.authService.getUserProfile(req.user.userId);
      res.status(200).json({
        status: 'success',
        data: { user },
      });
    } catch (error) {
      next(error);
    }
  };

  healthCheck = (_req: Request, res: Response): void => {
    res.status(200).json({
      status: 'healthy',
      service: 'user-auth-service',
      timestamp: new Date().toISOString(),
    });
  };
}
