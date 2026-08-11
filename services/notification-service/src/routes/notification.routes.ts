import { Router } from 'express';
import { NotificationController } from '../controllers/notification.controller';
import { NotificationService } from '../services/notification.service';

export const createNotificationRouter = (notificationService: NotificationService): Router => {
  const router = Router();
  const controller = new NotificationController(notificationService);

  router.get('/health', controller.healthCheck);
  router.get('/', controller.getNotifications);

  return router;
};
