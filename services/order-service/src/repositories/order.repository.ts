import { OrderModel, IOrderDocument } from '../models/order.model';
import { CreateOrderInput, OrderEntity, OrderStatus } from '../types/order.types';
import { deleteCache, getCache, setCache } from '../config/redis';

export interface IOrderRepository {
  create(userId: string, data: CreateOrderInput, totalAmount: number): Promise<OrderEntity>;
  findById(id: string): Promise<OrderEntity | null>;
  findByUserId(userId: string): Promise<OrderEntity[]>;
  updateStatus(id: string, status: OrderStatus): Promise<OrderEntity | null>;
  delete(id: string): Promise<boolean>;
}

export class OrderRepository implements IOrderRepository {
  private formatOrder(doc: IOrderDocument): OrderEntity {
    return {
      id: doc._id.toString(),
      userId: doc.userId,
      items: doc.items.map((item) => ({
        productId: item.productId,
        productName: item.productName,
        quantity: item.quantity,
        price: item.price,
      })),
      totalAmount: doc.totalAmount,
      status: doc.status,
      shippingAddress: doc.shippingAddress,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
    };
  }

  async create(userId: string, data: CreateOrderInput, totalAmount: number): Promise<OrderEntity> {
    const newOrder = await OrderModel.create({
      userId,
      items: data.items,
      totalAmount,
      shippingAddress: data.shippingAddress,
      status: 'PENDING',
    });

    const formatted = this.formatOrder(newOrder);

    // Cache the created order in Redis (TTL: 5 minutes)
    await setCache(`order:${formatted.id}`, formatted, 300);

    return formatted;
  }

  async findById(id: string): Promise<OrderEntity | null> {
    const cacheKey = `order:${id}`;

    // Read-Aside Cache check
    const cachedOrder = await getCache<OrderEntity>(cacheKey);
    if (cachedOrder) {
      return cachedOrder;
    }

    // Database fallback if cache miss
    const doc = await OrderModel.findById(id);
    if (!doc) {
      return null;
    }

    const formatted = this.formatOrder(doc);

    // Save to Redis cache
    await setCache(cacheKey, formatted, 300);

    return formatted;
  }

  async findByUserId(userId: string): Promise<OrderEntity[]> {
    const docs = await OrderModel.find({ userId }).sort({ createdAt: -1 });
    return docs.map((doc: IOrderDocument) => this.formatOrder(doc));
  }

  async updateStatus(id: string, status: OrderStatus): Promise<OrderEntity | null> {
    const updatedDoc = await OrderModel.findByIdAndUpdate(
      id,
      { status },
      { new: true }
    );

    if (!updatedDoc) {
      return null;
    }

    const formatted = this.formatOrder(updatedDoc);

    // Update Redis cache with new status
    await setCache(`order:${id}`, formatted, 300);

    return formatted;
  }

  async delete(id: string): Promise<boolean> {
    const result = await OrderModel.findByIdAndDelete(id);
    if (result) {
      // Invalidate Redis cache
      await deleteCache(`order:${id}`);
      return true;
    }
    return false;
  }
}
