import { OrderService } from '../../src/services/order.service';
import { IOrderRepository } from '../../src/repositories/order.repository';
import { OrderEntity } from '../../src/types/order.types';
import { AppError } from '../../src/middlewares/error.middleware';

describe('OrderService Unit Tests', () => {
  let orderService: OrderService;
  let mockOrderRepository: jest.Mocked<IOrderRepository>;

  const mockOrder: OrderEntity = {
    id: 'order-12345',
    userId: 'user-777',
    items: [
      { productId: 'p-1', productName: 'Laptop', quantity: 2, price: 1000 },
      { productId: 'p-2', productName: 'Mouse', quantity: 1, price: 50 },
    ],
    totalAmount: 2050,
    status: 'PENDING',
    shippingAddress: '123 Main St, Tech City',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(() => {
    mockOrderRepository = {
      create: jest.fn(),
      findById: jest.fn(),
      findByUserId: jest.fn(),
      updateStatus: jest.fn(),
      delete: jest.fn(),
    };

    orderService = new OrderService(mockOrderRepository);
  });

  describe('createOrder', () => {
    it('should calculate total amount correctly and create order', async () => {
      mockOrderRepository.create.mockResolvedValue(mockOrder);

      const result = await orderService.createOrder('user-777', {
        items: [
          { productId: 'p-1', productName: 'Laptop', quantity: 2, price: 1000 },
          { productId: 'p-2', productName: 'Mouse', quantity: 1, price: 50 },
        ],
        shippingAddress: '123 Main St, Tech City',
      });

      expect(mockOrderRepository.create).toHaveBeenCalledWith(
        'user-777',
        expect.anything(),
        2050
      );
      expect(result.totalAmount).toBe(2050);
    });

    it('should throw error if order items array is empty', async () => {
      await expect(
        orderService.createOrder('user-777', {
          items: [],
          shippingAddress: '123 Main St',
        })
      ).rejects.toThrow(AppError);
    });
  });

  describe('getOrderById', () => {
    it('should return order if requester is owner', async () => {
      mockOrderRepository.findById.mockResolvedValue(mockOrder);

      const order = await orderService.getOrderById('order-12345', 'user-777', 'USER');
      expect(order.id).toBe('order-12345');
    });

    it('should return order if requester is ADMIN even if not owner', async () => {
      mockOrderRepository.findById.mockResolvedValue(mockOrder);

      const order = await orderService.getOrderById('order-12345', 'different-user', 'ADMIN');
      expect(order.id).toBe('order-12345');
    });

    it('should throw 403 Forbidden if requester is not owner and not ADMIN', async () => {
      mockOrderRepository.findById.mockResolvedValue(mockOrder);

      await expect(
        orderService.getOrderById('order-12345', 'unauthorized-user', 'USER')
      ).rejects.toThrow(AppError);
    });

    it('should throw 404 Not Found if order does not exist', async () => {
      mockOrderRepository.findById.mockResolvedValue(null);

      await expect(
        orderService.getOrderById('nonexistent-id', 'user-777', 'USER')
      ).rejects.toThrow(AppError);
    });
  });

  describe('updateOrderStatus', () => {
    it('should update status successfully', async () => {
      const updatedOrder = { ...mockOrder, status: 'PROCESSING' as const };
      mockOrderRepository.findById.mockResolvedValue(mockOrder);
      mockOrderRepository.updateStatus.mockResolvedValue(updatedOrder);

      const result = await orderService.updateOrderStatus('order-12345', {
        status: 'PROCESSING',
      });

      expect(result.status).toBe('PROCESSING');
    });

    it('should throw 404 if order to update does not exist', async () => {
      mockOrderRepository.findById.mockResolvedValue(null);

      await expect(
        orderService.updateOrderStatus('unknown-id', { status: 'SHIPPED' })
      ).rejects.toThrow(AppError);
    });
  });

  describe('cancelOrder', () => {
    it('should cancel PENDING order successfully', async () => {
      const cancelledOrder = { ...mockOrder, status: 'CANCELLED' as const };
      mockOrderRepository.findById.mockResolvedValue(mockOrder);
      mockOrderRepository.updateStatus.mockResolvedValue(cancelledOrder);

      const result = await orderService.cancelOrder('order-12345', 'user-777', 'USER');
      expect(result.status).toBe('CANCELLED');
    });

    it('should throw error when trying to cancel an already DELIVERED order', async () => {
      const deliveredOrder = { ...mockOrder, status: 'DELIVERED' as const };
      mockOrderRepository.findById.mockResolvedValue(deliveredOrder);

      await expect(
        orderService.cancelOrder('order-12345', 'user-777', 'USER')
      ).rejects.toThrow(AppError);
    });
  });
});
