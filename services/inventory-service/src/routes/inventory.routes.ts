import { Router } from 'express';
import { InventoryController } from '../controllers/inventory.controller';
import { InventoryService } from '../services/inventory.service';

export const createInventoryRouter = (inventoryService: InventoryService): Router => {
  const router = Router();
  const controller = new InventoryController(inventoryService);

  router.get('/health', controller.healthCheck);
  router.get('/', controller.getAllInventory);
  router.post('/', controller.addOrUpdateItem);
  router.post('/reserve', controller.reserveStock);
  router.post('/release', controller.releaseStock);
  router.get('/:productId', controller.getItemByProductId);

  return router;
};
