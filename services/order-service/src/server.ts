import app from './app';
import { env } from './config/env';
import { connectMongoDB, disconnectMongoDB } from './config/database';
import { connectRedis, redisClient } from './config/redis';

const startServer = async () => {
  const server = app.listen(env.PORT, '0.0.0.0', () => {
    console.log(`🚀 order-service running on http://0.0.0.0:${env.PORT} in ${env.NODE_ENV} mode`);
  });

  try {
    await connectMongoDB();
    await connectRedis();
  } catch (error) {
    console.error('⚠️ Initial database/redis connection warning:', error);
  }

  const gracefulShutdown = async (signal: string) => {
    console.log(`\n⚠️ Received ${signal}. Shutting down order-service gracefully...`);
    server.close(async () => {
      console.log('🔒 HTTP server closed.');
      await disconnectMongoDB();
      redisClient.disconnect();
      console.log('👋 MongoDB & Redis connections closed. Exiting process.');
      process.exit(0);
    });
  };

  process.on('SIGINT', () => gracefulShutdown('SIGINT'));
  process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
};

startServer();
