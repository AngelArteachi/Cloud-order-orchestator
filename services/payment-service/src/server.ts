import { createPaymentApp } from './app';
import { env } from './config/env';
import { PaymentService } from './services/payment.service';

const startServer = () => {
  const paymentService = new PaymentService();
  const app = createPaymentApp(paymentService);

  const server = app.listen(env.PORT, '0.0.0.0', () => {
    console.log(`🚀 payment-service running on http://0.0.0.0:${env.PORT} in ${env.NODE_ENV} mode`);
  });

  const gracefulShutdown = (signal: string) => {
    console.log(`\n⚠️ Received ${signal}. Shutting down payment-service gracefully...`);
    server.close(() => {
      console.log('🔒 HTTP server closed. Exiting process.');
      process.exit(0);
    });
  };

  process.on('SIGINT', () => gracefulShutdown('SIGINT'));
  process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
};

startServer();
