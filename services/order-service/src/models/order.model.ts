import { Schema, model, Document, Types } from 'mongoose';
import { OrderItem, OrderStatus } from '../types/order.types';

export interface IOrderDocument extends Document {
  _id: Types.ObjectId;
  userId: string;
  items: OrderItem[];
  totalAmount: number;
  status: OrderStatus;
  shippingAddress: string;
  createdAt: Date;
  updatedAt: Date;
}

const OrderItemSchema = new Schema<OrderItem>(
  {
    productId: { type: String, required: true },
    productName: { type: String, required: true },
    quantity: { type: Number, required: true, min: 1 },
    price: { type: Number, required: true, min: 0 },
  },
  { _id: false }
);

const OrderSchema = new Schema<IOrderDocument>(
  {
    userId: { type: String, required: true, index: true },
    items: { type: [OrderItemSchema], required: true },
    totalAmount: { type: Number, required: true },
    status: {
      type: String,
      enum: ['PENDING', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED'],
      default: 'PENDING',
      index: true,
    },
    shippingAddress: { type: String, required: true },
  },
  {
    timestamps: true,
  }
);

export const OrderModel = model<IOrderDocument>('Order', OrderSchema);
