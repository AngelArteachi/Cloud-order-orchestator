import { z } from 'zod';

const orderItemSchema = z.object({
  productId: z.string({ required_error: 'Product ID is required' }).min(1),
  productName: z.string({ required_error: 'Product name is required' }).min(1),
  quantity: z
    .number({ required_error: 'Quantity is required' })
    .int('Quantity must be an integer')
    .min(1, 'Quantity must be at least 1'),
  price: z
    .number({ required_error: 'Price is required' })
    .min(0, 'Price cannot be negative'),
});

export const createOrderSchema = z.object({
  items: z
    .array(orderItemSchema, { required_error: 'Order items are required' })
    .min(1, 'Order must contain at least one item'),
  shippingAddress: z
    .string({ required_error: 'Shipping address is required' })
    .min(5, 'Shipping address must be at least 5 characters long'),
});

export const updateOrderStatusSchema = z.object({
  status: z.enum(['PENDING', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED'], {
    required_error: 'Status is required',
    invalid_type_error: 'Invalid order status',
  }),
});

export const orderIdParamSchema = z.object({
  id: z.string({ required_error: 'Order ID parameter is required' }).min(1),
});

export type CreateOrderSchema = z.infer<typeof createOrderSchema>;
export type UpdateOrderStatusSchema = z.infer<typeof updateOrderStatusSchema>;
