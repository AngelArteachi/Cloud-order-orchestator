import request from 'supertest';
import jwt from 'jsonwebtoken';
import app from '../../src/app';
import { OrderModel } from '../../src/models/order.model';
import { redisClient } from '../../src/config/redis';

process.env.JWT_SECRET = 'super_secret_jwt_key_change_in_production_32chars';

describe('Order Routes Integration Tests (Supertest)', () => {
  const userToken = jwt.sign(
    { userId: 'user-888', email: 'test.user@example.com', role: 'USER' },
    process.env.JWT_SECRET
  );

  const adminToken = jwt.sign(
    { userId: 'admin-999', email: 'admin.user@example.com', role: 'ADMIN' },
    process.env.JWT_SECRET
  );

  const mockDate = new Date();
  const mockOrderDoc: any = {
    _id: '666666666666666666666666',
    userId: 'user-888',
    items: [{ productId: 'p-100', productName: 'Smartphone', quantity: 1, price: 800 }],
    totalAmount: 800,
    status: 'PENDING',
    shippingAddress: '456 Tech Ave',
    createdAt: mockDate,
    updatedAt: mockDate,
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    try {
      if (redisClient.status === 'ready') {
        await redisClient.flushall();
      }
    } catch {
      // Ignore if Redis is offline during test run
    }
  });

  afterAll(async () => {
    redisClient.disconnect();
  });

  describe('GET /health', () => {
    it('should return 200 OK for healthcheck', async () => {
      const response = await request(app).get('/health');
      expect(response.status).toBe(200);
      expect(response.body).toEqual({ status: 'UP', service: 'order-service' });
    });
  });

  describe('POST /api/orders', () => {
    it('should create order when authorized (201 Created)', async () => {
      jest.spyOn(OrderModel, 'create').mockResolvedValue(mockOrderDoc as any);

      const response = await request(app)
        .post('/api/orders')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          items: [{ productId: 'p-100', productName: 'Smartphone', quantity: 1, price: 800 }],
          shippingAddress: '456 Tech Ave',
        });

      expect(response.status).toBe(201);
      expect(response.body.status).toBe('success');
      expect(response.body.data.order.totalAmount).toBe(800);
    });

    it('should return 401 Unauthorized if JWT token is missing', async () => {
      const response = await request(app)
        .post('/api/orders')
        .send({
          items: [{ productId: 'p-100', productName: 'Smartphone', quantity: 1, price: 800 }],
          shippingAddress: '456 Tech Ave',
        });

      expect(response.status).toBe(401);
      expect(response.body.status).toBe('error');
    });

    it('should return 400 Bad Request if items array is empty', async () => {
      const response = await request(app)
        .post('/api/orders')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          items: [],
          shippingAddress: '456 Tech Ave',
        });

      expect(response.status).toBe(400);
      expect(response.body.status).toBe('fail');
    });
  });

  describe('GET /api/orders', () => {
    it('should return authenticated user orders list (200 OK)', async () => {
      jest.spyOn(OrderModel, 'find').mockReturnValue({
        sort: jest.fn().mockResolvedValue([mockOrderDoc]),
      } as any);

      const response = await request(app)
        .get('/api/orders')
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('success');
      expect(response.body.results).toBe(1);
    });
  });

  describe('GET /api/orders/:id', () => {
    it('should return order details by ID (200 OK)', async () => {
      jest.spyOn(OrderModel, 'findById').mockResolvedValue(mockOrderDoc as any);

      const response = await request(app)
        .get('/api/orders/666666666666666666666666')
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('success');
      expect(response.body.data.order.id).toBe('666666666666666666666666');
    });

    it('should return 403 Forbidden if user tries to access another user\'s order', async () => {
      const otherUserDoc = { ...mockOrderDoc, _id: '777777777777777777777777', userId: 'other-user-123' };
      jest.spyOn(OrderModel, 'findById').mockResolvedValue(otherUserDoc as any);

      const response = await request(app)
        .get('/api/orders/777777777777777777777777')
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(403);
      expect(response.body.message).toContain('You do not own this order');
    });
  });

  describe('PATCH /api/orders/:id/status', () => {
    it('should allow ADMIN to update order status (200 OK)', async () => {
      const updatedDoc = { ...mockOrderDoc, status: 'PROCESSING' };
      jest.spyOn(OrderModel, 'findById').mockResolvedValue(mockOrderDoc as any);
      jest.spyOn(OrderModel, 'findByIdAndUpdate').mockResolvedValue(updatedDoc as any);

      const response = await request(app)
        .patch('/api/orders/666666666666666666666666/status')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: 'PROCESSING' });

      expect(response.status).toBe(200);
      expect(response.body.data.order.status).toBe('PROCESSING');
    });

    it('should forbid non-ADMIN user from updating order status (403 Forbidden)', async () => {
      const response = await request(app)
        .patch('/api/orders/666666666666666666666666/status')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ status: 'PROCESSING' });

      expect(response.status).toBe(403);
      expect(response.body.message).toContain('Insufficient permissions');
    });
  });

  describe('PATCH /api/orders/:id/cancel', () => {
    it('should allow owner to cancel order (200 OK)', async () => {
      const cancelledDoc = { ...mockOrderDoc, status: 'CANCELLED' };
      jest.spyOn(OrderModel, 'findById').mockResolvedValue(mockOrderDoc as any);
      jest.spyOn(OrderModel, 'findByIdAndUpdate').mockResolvedValue(cancelledDoc as any);

      const response = await request(app)
        .patch('/api/orders/666666666666666666666666/cancel')
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data.order.status).toBe('CANCELLED');
    });
  });
});
