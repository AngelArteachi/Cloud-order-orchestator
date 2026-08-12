import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import client from 'prom-client';
import { PaymentService } from './services/payment.service';
import { createPaymentRouter } from './routes/payment.routes';

const register = new client.Registry();
client.collectDefaultMetrics({ register, prefix: 'payment_' });

export const createPaymentApp = (paymentService: PaymentService): Application => {
  const app: Application = express();

  app.use(helmet());
  app.use(cors());
  app.use(express.json());

  app.get('/metrics', async (_req, res) => {
    res.setHeader('Content-Type', register.contentType);
    res.send(await register.metrics());
  });

  app.get('/health', (_req, res) => {
    res.status(200).json({ status: 'UP', service: 'payment-service' });
  });

  const router = createPaymentRouter(paymentService);
  app.use('/api/payments', router);

  app.use('*', (_req, res) => {
    res.status(404).json({ status: 'fail', message: 'Route not found in payment-service' });
  });

  return app;
};
