import { Request, Response } from 'express';
import { InventoryService } from '../services/inventory.service';

export class InventoryController {
  constructor(private inventoryService: InventoryService) {}

  getAllInventory = (_req: Request, res: Response): void => {
    const items = this.inventoryService.getAllInventory();
    res.status(200).json({
      status: 'success',
      results: items.length,
      data: { inventory: items },
    });
  };

  getItemByProductId = (req: Request, res: Response): void => {
    const { productId } = req.params;
    const item = this.inventoryService.getInventoryByProductId(productId);
    if (!item) {
      res.status(404).json({ status: 'fail', message: 'Product not found in inventory' });
      return;
    }
    res.status(200).json({
      status: 'success',
      data: { item },
    });
  };

  addOrUpdateItem = (req: Request, res: Response): void => {
    try {
      const { productId, productName, stockQuantity, price } = req.body;
      const item = this.inventoryService.addOrUpdateItem({
        productId,
        productName,
        stockQuantity,
        price,
      });

      res.status(201).json({
        status: 'success',
        message: 'Inventory item updated successfully',
        data: { item },
      });
    } catch (error: any) {
      res.status(400).json({ status: 'fail', message: error.message });
    }
  };

  reserveStock = (req: Request, res: Response): void => {
    try {
      const result = this.inventoryService.reserveStock(req.body);
      res.status(200).json({
        status: 'success',
        message: 'Stock reserved successfully',
        data: result,
      });
    } catch (error: any) {
      res.status(400).json({
        status: 'fail',
        message: error.message || 'Failed to reserve stock',
      });
    }
  };

  releaseStock = (req: Request, res: Response): void => {
    try {
      const result = this.inventoryService.releaseStock(req.body);
      res.status(200).json({
        status: 'success',
        message: 'Stock restored successfully',
        data: result,
      });
    } catch (error: any) {
      res.status(400).json({
        status: 'fail',
        message: error.message || 'Failed to release stock',
      });
    }
  };

  healthCheck = (_req: Request, res: Response): void => {
    res.status(200).json({
      status: 'UP',
      service: 'inventory-service',
      timestamp: new Date().toISOString(),
    });
  };
}
