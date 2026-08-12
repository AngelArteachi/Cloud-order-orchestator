import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import client from 'prom-client';
import { InventoryService } from './services/inventory.service';
import { createInventoryRouter } from './routes/inventory.routes';

const register = new client.Registry();
client.collectDefaultMetrics({ register, prefix: 'inventory_' });

export const createInventoryApp = (inventoryService: InventoryService): Application => {
  const app: Application = express();

  app.use(helmet());
  app.use(cors());
  app.use(express.json());

  app.get('/metrics', async (_req, res) => {
    res.setHeader('Content-Type', register.contentType);
    res.send(await register.metrics());
  });

  app.get('/health', (_req, res) => {
    res.status(200).json({ status: 'UP', service: 'inventory-service' });
  });

  const router = createInventoryRouter(inventoryService);
  app.use('/api/inventory', router);

  app.use('*', (_req, res) => {
    res.status(404).json({ status: 'fail', message: 'Route not found in inventory-service' });
  });

  return app;
};
