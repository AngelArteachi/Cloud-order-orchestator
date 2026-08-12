import { InventoryItem, ReleaseStockInput, ReserveStockInput } from '../types/inventory.types';

export class InventoryService {
  private itemsMap: Map<string, InventoryItem> = new Map();

  constructor() {
    this.seedDefaultInventory();
  }

  private seedDefaultInventory(): void {
    const defaultItems: InventoryItem[] = [
      {
        productId: 'prod-101',
        productName: 'MacBook Pro M3',
        stockQuantity: 15,
        price: 1999.99,
        updatedAt: new Date(),
      },
      {
        productId: 'prod-ethereal',
        productName: 'Laptop Gaming Legion M16',
        stockQuantity: 10,
        price: 1499.99,
        updatedAt: new Date(),
      },
      {
        productId: 'p-100',
        productName: 'Smartphone Pro Max',
        stockQuantity: 25,
        price: 800.0,
        updatedAt: new Date(),
      },
      {
        productId: 'gw-101',
        productName: 'Teclado Mecánico RGB',
        stockQuantity: 30,
        price: 129.99,
        updatedAt: new Date(),
      },
    ];

    defaultItems.forEach((item) => {
      this.itemsMap.set(item.productId, item);
    });
  }

  public getAllInventory(): InventoryItem[] {
    return Array.from(this.itemsMap.values());
  }

  public getInventoryByProductId(productId: string): InventoryItem | null {
    return this.itemsMap.get(productId) || null;
  }

  public addOrUpdateItem(input: {
    productId: string;
    productName: string;
    stockQuantity: number;
    price: number;
  }): InventoryItem {
    const item: InventoryItem = {
      productId: input.productId,
      productName: input.productName,
      stockQuantity: input.stockQuantity,
      price: input.price,
      updatedAt: new Date(),
    };
    this.itemsMap.set(input.productId, item);
    return item;
  }

  public reserveStock(input: ReserveStockInput): { reserved: boolean; items: InventoryItem[] } {
    if (!input.items || input.items.length === 0) {
      throw new Error('Items list cannot be empty for stock reservation');
    }

    // Step 1: Pre-check stock availability for ALL requested items
    for (const reqItem of input.items) {
      const existing = this.itemsMap.get(reqItem.productId);
      
      // Dynamic fallback for new unseeded product IDs: seed with 50 items
      if (!existing) {
        this.itemsMap.set(reqItem.productId, {
          productId: reqItem.productId,
          productName: `Product ${reqItem.productId}`,
          stockQuantity: 50,
          price: 99.99,
          updatedAt: new Date(),
        });
      }

      const item = this.itemsMap.get(reqItem.productId)!;
      if (item.stockQuantity < reqItem.quantity) {
        throw new Error(
          `Insufficient stock for product '${item.productName}' (${item.productId}). Requested: ${reqItem.quantity}, Available: ${item.stockQuantity}`
        );
      }
    }

    // Step 2: Atomically deduct stock quantities
    const updatedItems: InventoryItem[] = [];
    for (const reqItem of input.items) {
      const item = this.itemsMap.get(reqItem.productId)!;
      item.stockQuantity -= reqItem.quantity;
      item.updatedAt = new Date();
      updatedItems.push({ ...item });
      console.log(`📦 Stock reserved for ${item.productName} (-${reqItem.quantity}). Remaining: ${item.stockQuantity}`);
    }

    return { reserved: true, items: updatedItems };
  }

  public releaseStock(input: ReleaseStockInput): { released: boolean; items: InventoryItem[] } {
    if (!input.items || input.items.length === 0) {
      return { released: false, items: [] };
    }

    const updatedItems: InventoryItem[] = [];
    for (const reqItem of input.items) {
      const item = this.itemsMap.get(reqItem.productId);
      if (item) {
        item.stockQuantity += reqItem.quantity;
        item.updatedAt = new Date();
        updatedItems.push({ ...item });
        console.log(`↩️ Stock restored for ${item.productName} (+${reqItem.quantity}). New total: ${item.stockQuantity}`);
      }
    }

    return { released: true, items: updatedItems };
  }
}
