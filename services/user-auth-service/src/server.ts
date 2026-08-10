import app from './app';
import { env } from './config/env';
import { connectDB, disconnectDB } from './config/prisma';

const startServer = async () => {
  const server = app.listen(env.PORT, '0.0.0.0', () => {
    console.log(`🚀 user-auth-service running on http://0.0.0.0:${env.PORT} in ${env.NODE_ENV} mode`);
  });

  try {
    await connectDB();
  } catch (error) {
    console.error('⚠️ Initial DB connection attempt failed, will retry on request:', error);
  }

  const gracefulShutdown = async (signal: string) => {
    console.log(`\n⚠️ Received ${signal}. Shutting down gracefully...`);
    server.close(async () => {
      console.log('🔒 HTTP server closed.');
      await disconnectDB();
      console.log('👋 Database connection closed. Exiting process.');
      process.exit(0);
    });
  };

  process.on('SIGINT', () => gracefulShutdown('SIGINT'));
  process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
};

startServer();
