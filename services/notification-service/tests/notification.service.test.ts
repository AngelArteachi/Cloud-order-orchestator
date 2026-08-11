import request from 'supertest';
import { createNotificationApp } from '../src/app';
import { NotificationService } from '../src/services/notification.service';

describe('NotificationService & Express API Tests', () => {
  let notificationService: NotificationService;
  let app: any;

  beforeEach(() => {
    notificationService = new NotificationService();
    app = createNotificationApp(notificationService);
  });

  it('should process ORDER_CREATED event and create email notification log', async () => {
    const log = await notificationService.handleEvent({
      event: 'ORDER_CREATED',
      orderId: 'ord-100',
      userId: 'user-abc',
      totalAmount: 150.75,
      shippingAddress: '789 Ocean Drive',
    });

    expect(log.id).toBeDefined();
    expect(log.event).toBe('ORDER_CREATED');
    expect(log.subject).toContain('Order Confirmation #ord-100');
    expect(log.body).toContain('789 Ocean Drive');

    const history = notificationService.getNotificationLogs();
    expect(history.length).toBe(1);
  });

  it('should process ORDER_STATUS_UPDATED event correctly', async () => {
    const log = await notificationService.handleEvent({
      event: 'ORDER_STATUS_UPDATED',
      orderId: 'ord-200',
      userId: 'user-xyz',
      status: 'SHIPPED',
    });

    expect(log.event).toBe('ORDER_STATUS_UPDATED');
    expect(log.subject).toContain('Status Update: SHIPPED');
  });

  it('should expose /health status 200 OK', async () => {
    const response = await request(app).get('/health');
    expect(response.status).toBe(200);
    expect(response.body).toEqual({ status: 'UP', service: 'notification-service' });
  });

  it('should return notification history via GET /api/notifications', async () => {
    await notificationService.handleEvent({
      event: 'ORDER_CREATED',
      orderId: 'ord-300',
      userId: 'user-999',
      totalAmount: 99.99,
      shippingAddress: 'Main Street 12',
    });

    const response = await request(app).get('/api/notifications');

    expect(response.status).toBe(200);
    expect(response.body.status).toBe('success');
    expect(response.body.results).toBe(1);
    expect(response.body.data.notifications[0].orderId).toBe('ord-300');
  });
});
