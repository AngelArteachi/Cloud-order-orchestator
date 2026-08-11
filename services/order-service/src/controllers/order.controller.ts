import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
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

  handlePaymentWebhook = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const signature = req.headers['x-webhook-signature'] as string;
      const webhookSecret = process.env.WEBHOOK_SECRET || 'super_secret_webhook_signing_key_32chars';

      if (!signature) {
        throw new AppError('Webhook signature header missing', 401);
      }

      const expectedSignature = crypto
        .createHmac('sha256', webhookSecret)
        .update(JSON.stringify(req.body))
        .digest('hex');

      if (signature !== expectedSignature) {
        throw new AppError('Invalid webhook signature', 401);
      }

      const { orderId, status } = req.body;
      if (status === 'SUCCESS' && orderId) {
        const updatedOrder = await this.orderService.updateOrderStatus(orderId, { status: 'PROCESSING' });
        res.status(200).json({
          status: 'success',
          message: 'Payment webhook processed and order status updated to PROCESSING',
          data: { order: updatedOrder },
        });
        return;
      }

      res.status(200).json({ status: 'success', message: 'Webhook received' });
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
