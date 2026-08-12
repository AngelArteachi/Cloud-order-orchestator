export interface InventoryItem {
  productId: string;
  productName: string;
  stockQuantity: number;
  price: number;
  updatedAt: Date;
}

export interface ReserveStockInput {
  items: Array<{
    productId: string;
    quantity: number;
  }>;
}

export interface ReleaseStockInput {
  items: Array<{
    productId: string;
    quantity: number;
  }>;
}
