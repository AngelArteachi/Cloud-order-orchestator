import express, { Application } from 'express';
import cors from 'cors';
import client from 'prom-client';
import orderRoutes from './routes/order.routes';
import { errorHandler } from './middlewares/error.middleware';

const app: Application = express();

const register = new client.Registry();
client.collectDefaultMetrics({ register, prefix: 'order_' });

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Metrics
app.get('/metrics', async (_req, res) => {
  res.setHeader('Content-Type', register.contentType);
  res.send(await register.metrics());
});

// Health check root
app.get('/health', (_req, res) => {
  res.status(200).json({ status: 'UP', service: 'order-service' });
});

// Order Routes
app.use('/api/orders', orderRoutes);

// 404 Handler
app.use('*', (_req, res) => {
  res.status(404).json({ status: 'fail', message: 'Route not found in order-service' });
});

// Global Error Handler
app.use(errorHandler);

export default app;
