import app from './app';
import { env } from './config/env';
import { connectRedis, redisClient } from './config/redis';

const startServer = async () => {
  const server = app.listen(env.PORT, '0.0.0.0', () => {
    console.log(`🚀 api-gateway running on http://0.0.0.0:${env.PORT} in ${env.NODE_ENV} mode`);
  });

  try {
    await connectRedis();
  } catch (error) {
    console.error('⚠️ Redis connection warning in api-gateway:', error);
  }

  const gracefulShutdown = async (signal: string) => {
    console.log(`\n⚠️ Received ${signal}. Shutting down api-gateway gracefully...`);
    server.close(() => {
      console.log('🔒 HTTP server closed.');
      redisClient.disconnect();
      console.log('👋 Redis connection closed. Exiting process.');
      process.exit(0);
    });
  };

  process.on('SIGINT', () => gracefulShutdown('SIGINT'));
  process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
};

startServer();
