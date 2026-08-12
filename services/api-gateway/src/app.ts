import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import proxyRoutes from './routes/proxy.routes';
import { globalRateLimiter } from './middlewares/rateLimiter.middleware';
import { errorHandler } from './middlewares/error.middleware';
import { setupGatewayMetrics } from './middlewares/metrics.middleware';
import { DashboardController } from './controllers/dashboard.controller';

const app: Application = express();
const dashboardController = new DashboardController();

// Disable contentSecurityPolicy in Helmet for Dashboard inline scripts
app.use(
  helmet({
    contentSecurityPolicy: false,
  })
);
app.use(cors());

// Prometheus Metrics Setup
setupGatewayMetrics(app);

// Healthcheck & Dashboard UI
app.get('/health', (_req, res) => {
  res.status(200).json({
    status: 'UP',
    service: 'api-gateway',
    timestamp: new Date().toISOString(),
  });
});

app.get('/dashboard', dashboardController.renderDashboardHTML);
app.get('/api/dashboard', dashboardController.getDashboardJSON);

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
