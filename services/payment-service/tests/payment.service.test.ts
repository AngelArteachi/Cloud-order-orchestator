import request from 'supertest';
import { createPaymentApp } from '../src/app';
import { PaymentService } from '../src/services/payment.service';
import { generateWebhookSignature, verifyWebhookSignature } from '../src/utils/webhook.utils';

describe('PaymentService & Cryptographic Webhooks Tests', () => {
  let paymentService: PaymentService;
  let app: any;

  beforeEach(() => {
    paymentService = new PaymentService();
    app = createPaymentApp(paymentService);
  });

  it('should process checkout successfully and generate transaction ID', async () => {
    const result = await paymentService.processCheckout({
      orderId: 'ord-555',
      amount: 499.99,
      currency: 'USD',
    });

    expect(result.transaction.transactionId).toBeDefined();
    expect(result.transaction.orderId).toBe('ord-555');
    expect(result.transaction.amount).toBe(499.99);
    expect(result.transaction.status).toBe('SUCCESS');
  });

  it('should generate and verify valid HMAC SHA-256 webhook signatures', () => {
    const secret = 'super_secret_key_for_testing_123';
    const payload = {
      event: 'PAYMENT_SUCCESS',
      transactionId: 'tx-123',
      orderId: 'ord-555',
      amount: 499.99,
    };

    const signature = generateWebhookSignature(payload, secret);
    expect(signature).toBeDefined();
    expect(typeof signature).toBe('string');

    const isValid = verifyWebhookSignature(payload, signature, secret);
    expect(isValid).toBe(true);

    const isInvalid = verifyWebhookSignature(payload, 'invalid_signature_hex', secret);
    expect(isInvalid).toBe(false);
  });

  it('should return 200 OK via POST /api/payments/checkout', async () => {
    const response = await request(app)
      .post('/api/payments/checkout')
      .send({
        orderId: 'ord-777',
        amount: 199.99,
      });

    expect(response.status).toBe(200);
    expect(response.body.status).toBe('success');
    expect(response.body.data.transaction.orderId).toBe('ord-777');
  });

  it('should return 400 Bad Request if orderId is missing during checkout', async () => {
    const response = await request(app)
      .post('/api/payments/checkout')
      .send({
        amount: 100,
      });

    expect(response.status).toBe(400);
    expect(response.body.status).toBe('fail');
  });

  it('should return transaction history via GET /api/payments/transactions', async () => {
    await paymentService.processCheckout({
      orderId: 'ord-888',
      amount: 150.0,
    });

    const response = await request(app).get('/api/payments/transactions');

    expect(response.status).toBe(200);
    expect(response.body.status).toBe('success');
    expect(response.body.results).toBe(1);
  });
});
