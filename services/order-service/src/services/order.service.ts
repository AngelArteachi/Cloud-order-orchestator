import { IOrderRepository, OrderRepository } from '../repositories/order.repository';
import { CreateOrderInput, OrderEntity, UpdateOrderStatusInput } from '../types/order.types';
import { AppError } from '../middlewares/error.middleware';
import { publishEvent } from '../config/redis';
import { env } from '../config/env';

export class OrderService {
  constructor(private orderRepository: IOrderRepository = new OrderRepository()) {}

  async createOrder(userId: string, input: CreateOrderInput): Promise<OrderEntity> {
    if (!input.items || input.items.length === 0) {
      throw new AppError('Order items cannot be empty', 400);
    }

    // Step 1: Reserve stock from inventory-service
    if (process.env.NODE_ENV !== 'test') {
      try {
        const reserveRes = await fetch(`${env.INVENTORY_SERVICE_URL}/api/inventory/reserve`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            items: input.items.map((item) => ({
              productId: item.productId,
              quantity: item.quantity,
            })),
          }),
        });

        if (!reserveRes.ok) {
          const errorData: any = await reserveRes.json().catch(() => ({}));
          throw new AppError(errorData.message || 'Insufficient stock for requested items', 400);
        }
      } catch (err) {
        if (err instanceof AppError) throw err;
        console.error('⚠️ Could not connect to inventory-service for stock reservation:', err);
      }
    }

    // Calculate total amount
    const totalAmount = input.items.reduce((sum, item) => {
      return sum + item.price * item.quantity;
    }, 0);

    const order = await this.orderRepository.create(userId, input, totalAmount);

    // Publish ORDER_CREATED event via Redis Pub/Sub
    await publishEvent('order:events', {
      event: 'ORDER_CREATED',
      orderId: order.id,
      userId: order.userId,
      items: order.items,
      totalAmount: order.totalAmount,
      shippingAddress: order.shippingAddress,
    });

    return order;
  }

  async getOrderById(
    id: string,
    requesterUserId?: string,
    requesterRole?: 'USER' | 'ADMIN'
  ): Promise<OrderEntity> {
    const order = await this.orderRepository.findById(id);
    if (!order) {
      throw new AppError('Order not found', 404);
    }

    if (requesterUserId && requesterRole !== 'ADMIN' && order.userId !== requesterUserId) {
      throw new AppError('Access forbidden: You do not own this order', 403);
    }

    return order;
  }

  async getUserOrders(userId: string): Promise<OrderEntity[]> {
    return this.orderRepository.findByUserId(userId);
  }

  async updateOrderStatus(id: string, input: UpdateOrderStatusInput): Promise<OrderEntity> {
    const existingOrder = await this.orderRepository.findById(id);
    if (!existingOrder) {
      throw new AppError('Order not found', 404);
    }

    const updatedOrder = await this.orderRepository.updateStatus(id, input.status);
    if (!updatedOrder) {
      throw new AppError('Failed to update order status', 400);
    }

    // Publish ORDER_STATUS_UPDATED event via Redis Pub/Sub
    await publishEvent('order:events', {
      event: 'ORDER_STATUS_UPDATED',
      orderId: updatedOrder.id,
      userId: updatedOrder.userId,
      status: updatedOrder.status,
    });

    return updatedOrder;
  }

  async cancelOrder(
    id: string,
    requesterUserId: string,
    requesterRole: 'USER' | 'ADMIN'
  ): Promise<OrderEntity> {
    const order = await this.orderRepository.findById(id);
    if (!order) {
      throw new AppError('Order not found', 404);
    }

    if (requesterRole !== 'ADMIN' && order.userId !== requesterUserId) {
      throw new AppError('Access forbidden: You cannot cancel another user\'s order', 403);
    }

    if (order.status === 'DELIVERED') {
      throw new AppError('Cannot cancel an order that has already been delivered', 400);
    }

    if (order.status === 'CANCELLED') {
      throw new AppError('Order is already cancelled', 400);
    }

    const cancelledOrder = await this.orderRepository.updateStatus(id, 'CANCELLED');
    if (!cancelledOrder) {
      throw new AppError('Failed to cancel order', 400);
    }

    // Release stock back to inventory-service
    if (process.env.NODE_ENV !== 'test') {
      try {
        await fetch(`${env.INVENTORY_SERVICE_URL}/api/inventory/release`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            items: order.items.map((item) => ({
              productId: item.productId,
              quantity: item.quantity,
            })),
          }),
        });
      } catch (err) {
        console.error('⚠️ Could not release stock to inventory-service:', err);
      }
    }

    // Publish ORDER_STATUS_UPDATED event via Redis Pub/Sub
    await publishEvent('order:events', {
      event: 'ORDER_STATUS_UPDATED',
      orderId: cancelledOrder.id,
      userId: cancelledOrder.userId,
      status: cancelledOrder.status,
    });

    return cancelledOrder;
  }
}
