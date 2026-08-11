import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import proxyRoutes from './routes/proxy.routes';
import { globalRateLimiter } from './middlewares/rateLimiter.middleware';
import { errorHandler } from './middlewares/error.middleware';

const app: Application = express();

app.use(helmet());
app.use(cors());

// Healthcheck
app.get('/health', (_req, res) => {
  res.status(200).json({
    status: 'UP',
    service: 'api-gateway',
    timestamp: new Date().toISOString(),
  });
});

// Apply Rate Limiter to API routes
if (process.env.NODE_ENV !== 'test') {
  app.use('/api', globalRateLimiter);
}

// Proxy Routes
app.use(proxyRoutes);

// 404 Handler
app.use('*', (_req, res) => {
  res.status(404).json({ status: 'fail', message: 'Route not found in api-gateway' });
});

// Global Error Handler
app.use(errorHandler);

export default app;
