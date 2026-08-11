import { Request, Response, NextFunction } from 'express';
import { OrderService } from '../services/order.service';
import { AuthenticatedRequest } from '../types/order.types';
import { AppError } from '../middlewares/error.middleware';

export class OrderController {
  constructor(private orderService: OrderService = new OrderService()) {}

  createOrder = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        throw new AppError('Unauthorized', 401);
      }

      const order = await this.orderService.createOrder(req.user.userId, req.body);
      res.status(201).json({
        status: 'success',
        message: 'Order created successfully',
        data: { order },
      });
    } catch (error) {
      next(error);
    }
  };

  getUserOrders = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        throw new AppError('Unauthorized', 401);
      }

      const orders = await this.orderService.getUserOrders(req.user.userId);
      res.status(200).json({
        status: 'success',
        results: orders.length,
        data: { orders },
      });
    } catch (error) {
      next(error);
    }
  };

  getOrderById = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        throw new AppError('Unauthorized', 401);
      }

      const { id } = req.params;
      const order = await this.orderService.getOrderById(id, req.user.userId, req.user.role);
      res.status(200).json({
        status: 'success',
        data: { order },
      });
    } catch (error) {
      next(error);
    }
  };

  updateStatus = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const updatedOrder = await this.orderService.updateOrderStatus(id, req.body);
      res.status(200).json({
        status: 'success',
        message: 'Order status updated successfully',
        data: { order: updatedOrder },
      });
    } catch (error) {
      next(error);
    }
  };

  cancelOrder = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        throw new AppError('Unauthorized', 401);
      }

      const { id } = req.params;
      const cancelledOrder = await this.orderService.cancelOrder(id, req.user.userId, req.user.role);
      res.status(200).json({
        status: 'success',
        message: 'Order cancelled successfully',
        data: { order: cancelledOrder },
      });
    } catch (error) {
      next(error);
    }
  };

  healthCheck = (_req: Request, res: Response): void => {
    res.status(200).json({
      status: 'healthy',
      service: 'order-service',
      timestamp: new Date().toISOString(),
    });
  };
}
