import { IOrderRepository, OrderRepository } from '../repositories/order.repository';
import { CreateOrderInput, OrderEntity, UpdateOrderStatusInput } from '../types/order.types';
import { AppError } from '../middlewares/error.middleware';

export class OrderService {
  constructor(private orderRepository: IOrderRepository = new OrderRepository()) {}

  async createOrder(userId: string, input: CreateOrderInput): Promise<OrderEntity> {
    if (!input.items || input.items.length === 0) {
      throw new AppError('Order items cannot be empty', 400);
    }

    // Calculate total amount
    const totalAmount = input.items.reduce((sum, item) => {
      return sum + item.price * item.quantity;
    }, 0);

    return this.orderRepository.create(userId, input, totalAmount);
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

    return cancelledOrder;
  }
}
