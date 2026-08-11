import express, { Application } from 'express';
import cors from 'cors';
import orderRoutes from './routes/order.routes';
import { errorHandler } from './middlewares/error.middleware';

const app: Application = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

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
