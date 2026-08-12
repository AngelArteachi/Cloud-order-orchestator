import { createInventoryApp } from './app';
import { env } from './config/env';
import { InventoryService } from './services/inventory.service';

const startServer = () => {
  const inventoryService = new InventoryService();
  const app = createInventoryApp(inventoryService);

  const server = app.listen(env.PORT, '0.0.0.0', () => {
    console.log(`🚀 inventory-service running on http://0.0.0.0:${env.PORT} in ${env.NODE_ENV} mode`);
  });

  const gracefulShutdown = (signal: string) => {
    console.log(`\n⚠️ Received ${signal}. Shutting down inventory-service gracefully...`);
    server.close(() => {
      console.log('🔒 HTTP server closed. Exiting process.');
      process.exit(0);
    });
  };

  process.on('SIGINT', () => gracefulShutdown('SIGINT'));
  process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
};

startServer();
