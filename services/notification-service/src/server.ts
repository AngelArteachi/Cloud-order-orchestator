import { createNotificationApp } from './app';
import { env } from './config/env';
import { redisSubscriber } from './config/redis';
import { NotificationService } from './services/notification.service';

const startServer = async () => {
  const notificationService = new NotificationService();
  const app = createNotificationApp(notificationService);

  const server = app.listen(env.PORT, '0.0.0.0', () => {
    console.log(`🚀 notification-service running on http://0.0.0.0:${env.PORT} in ${env.NODE_ENV} mode`);
  });

  await notificationService.subscribeToEvents();

  const gracefulShutdown = async (signal: string) => {
    console.log(`\n⚠️ Received ${signal}. Shutting down notification-service gracefully...`);
    server.close(() => {
      console.log('🔒 HTTP server closed.');
      redisSubscriber.disconnect();
      console.log('👋 Redis subscriber disconnected. Exiting process.');
      process.exit(0);
    });
  };

  process.on('SIGINT', () => gracefulShutdown('SIGINT'));
  process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
};

startServer();
