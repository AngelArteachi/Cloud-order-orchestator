export interface CheckoutInput {
  orderId: string;
  amount: number;
  currency?: string;
  cardToken?: string;
}

export interface PaymentTransaction {
  transactionId: string;
  orderId: string;
  amount: number;
  currency: string;
  status: 'SUCCESS' | 'FAILED';
  createdAt: Date;
}

export interface PaymentWebhookPayload {
  event: 'PAYMENT_SUCCESS' | 'PAYMENT_FAILED';
  transactionId: string;
  orderId: string;
  amount: number;
  currency: string;
  status: string;
  timestamp: string;
}
