export type EventType = 'ORDER_CREATED' | 'ORDER_STATUS_UPDATED';

export interface OrderEventPayload {
  event: EventType;
  orderId: string;
  userId: string;
  items?: Array<{ productId: string; productName: string; quantity: number; price: number }>;
  totalAmount?: number;
  status?: string;
  shippingAddress?: string;
}

export interface NotificationLog {
  id: string;
  event: EventType;
  orderId: string;
  userId: string;
  subject: string;
  body: string;
  previewUrl?: string;
  sentAt: Date;
}
