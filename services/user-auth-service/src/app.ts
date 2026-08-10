import express, { Application } from 'express';
import cors from 'cors';
import authRoutes from './routes/auth.routes';
import { errorHandler } from './middlewares/error.middleware';

const app: Application = express();

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health Check Root
app.get('/health', (_req, res) => {
  res.status(200).json({ status: 'UP', service: 'user-auth-service' });
});

// Routes
app.use('/api/auth', authRoutes);

// 404 Route Handler
app.use('*', (_req, res) => {
  res.status(404).json({ status: 'fail', message: 'Route not found' });
});

// Global Error Handler
app.use(errorHandler);

export default app;
