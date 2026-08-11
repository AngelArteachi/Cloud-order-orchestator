import { env } from '../config/env';
import { CheckoutInput, PaymentTransaction, PaymentWebhookPayload } from '../types/payment.types';
import { generateWebhookSignature } from '../utils/webhook.utils';

export class PaymentService {
  private transactions: PaymentTransaction[] = [];

  public async processCheckout(input: CheckoutInput): Promise<{ transaction: PaymentTransaction; webhookSent: boolean }> {
    if (!input.orderId) {
      throw new Error('Order ID is required for checkout');
    }
    if (!input.amount || input.amount <= 0) {
      throw new Error('Valid payment amount is required');
    }

    const transactionId = `tx-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const currency = input.currency || 'USD';

    const transaction: PaymentTransaction = {
      transactionId,
      orderId: input.orderId,
      amount: input.amount,
      currency,
      status: 'SUCCESS',
      createdAt: new Date(),
    };

    this.transactions.push(transaction);

    // Prepare Webhook Payload
    const webhookPayload: PaymentWebhookPayload = {
      event: 'PAYMENT_SUCCESS',
      transactionId: transaction.transactionId,
      orderId: transaction.orderId,
      amount: transaction.amount,
      currency: transaction.currency,
      status: 'SUCCESS',
      timestamp: new Date().toISOString(),
    };

    // Sign payload with HMAC SHA-256
    const signature = generateWebhookSignature(webhookPayload, env.WEBHOOK_SECRET);

    let webhookSent = false;

    if (process.env.NODE_ENV !== 'test') {
      try {
        const response = await fetch(`${env.ORDER_SERVICE_URL}/api/orders/webhook/payment`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-webhook-signature': signature,
          },
          body: JSON.stringify(webhookPayload),
        });

        if (response.ok) {
          webhookSent = true;
          console.log(`✅ Webhook delivered to order-service for order #${transaction.orderId}`);
        } else {
          console.error(`⚠️ Webhook delivery failed with status ${response.status}`);
        }
      } catch (err) {
        console.error('⚠️ Error dispatching webhook to order-service:', err);
      }
    }

    return { transaction, webhookSent };
  }

  public getTransactions(): PaymentTransaction[] {
    return this.transactions;
  }
}
