import request from 'supertest';
import { createInventoryApp } from '../src/app';
import { InventoryService } from '../src/services/inventory.service';

describe('InventoryService & Express API Tests', () => {
  let inventoryService: InventoryService;
  let app: any;

  beforeEach(() => {
    inventoryService = new InventoryService();
    app = createInventoryApp(inventoryService);
  });

  it('should seed default inventory items on initialization', () => {
    const items = inventoryService.getAllInventory();
    expect(items.length).toBeGreaterThan(0);
    expect(items.some((item) => item.productId === 'prod-101')).toBe(true);
  });

  it('should reserve stock atomically when sufficient quantity exists', () => {
    const initialItem = inventoryService.getInventoryByProductId('prod-101')!;
    const initialStock = initialItem.stockQuantity;

    const result = inventoryService.reserveStock({
      items: [{ productId: 'prod-101', quantity: 3 }],
    });

    expect(result.reserved).toBe(true);
    const updatedItem = inventoryService.getInventoryByProductId('prod-101')!;
    expect(updatedItem.stockQuantity).toBe(initialStock - 3);
  });

  it('should throw error when attempting to reserve more stock than available', () => {
    expect(() => {
      inventoryService.reserveStock({
        items: [{ productId: 'prod-101', quantity: 9999 }],
      });
    }).toThrow(/Insufficient stock/);
  });

  it('should restore stock when releaseStock is called', () => {
    const initialItem = inventoryService.getInventoryByProductId('prod-101')!;
    const initialStock = initialItem.stockQuantity;

    const result = inventoryService.releaseStock({
      items: [{ productId: 'prod-101', quantity: 5 }],
    });

    expect(result.released).toBe(true);
    const updatedItem = inventoryService.getInventoryByProductId('prod-101')!;
    expect(updatedItem.stockQuantity).toBe(initialStock + 5);
  });

  it('should return 200 OK for GET /api/inventory', async () => {
    const response = await request(app).get('/api/inventory');
    expect(response.status).toBe(200);
    expect(response.body.status).toBe('success');
    expect(response.body.data.inventory.length).toBeGreaterThan(0);
  });

  it('should reserve stock via POST /api/inventory/reserve', async () => {
    const response = await request(app)
      .post('/api/inventory/reserve')
      .send({
        items: [{ productId: 'prod-ethereal', quantity: 2 }],
      });

    expect(response.status).toBe(200);
    expect(response.body.status).toBe('success');
    expect(response.body.data.reserved).toBe(true);
  });
});
