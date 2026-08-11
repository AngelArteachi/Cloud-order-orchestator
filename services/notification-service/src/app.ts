import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { NotificationService } from './services/notification.service';
import { createNotificationRouter } from './routes/notification.routes';

export const createNotificationApp = (notificationService: NotificationService): Application => {
  const app: Application = express();

  app.use(helmet());
  app.use(cors());
  app.use(express.json());

  app.get('/health', (_req, res) => {
    res.status(200).json({ status: 'UP', service: 'notification-service' });
  });

  const router = createNotificationRouter(notificationService);
  app.use('/api/notifications', router);

  app.use('*', (_req, res) => {
    res.status(404).json({ status: 'fail', message: 'Route not found in notification-service' });
  });

  return app;
};
