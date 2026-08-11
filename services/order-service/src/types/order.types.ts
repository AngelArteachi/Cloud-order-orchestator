import { Request } from 'express';

export type OrderStatus = 'PENDING' | 'PROCESSING' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED';

export interface OrderItem {
  productId: string;
  productName: string;
  quantity: number;
  price: number;
}

export interface OrderEntity {
  id: string;
  userId: string;
  items: OrderItem[];
  totalAmount: number;
  status: OrderStatus;
  shippingAddress: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateOrderInput {
  items: OrderItem[];
  shippingAddress: string;
}

export interface UpdateOrderStatusInput {
  status: OrderStatus;
}

export interface JWTPayload {
  userId: string;
  email: string;
  role: 'USER' | 'ADMIN';
  iat?: number;
  exp?: number;
}

export interface AuthenticatedRequest extends Request {
  user?: JWTPayload;
}
