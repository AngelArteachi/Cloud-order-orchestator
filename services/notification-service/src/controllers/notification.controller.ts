import { Request, Response } from 'express';
import { NotificationService } from '../services/notification.service';

export class NotificationController {
  constructor(private notificationService: NotificationService) {}

  getNotifications = (_req: Request, res: Response): void => {
    const logs = this.notificationService.getNotificationLogs();
    res.status(200).json({
      status: 'success',
      results: logs.length,
      data: { notifications: logs },
    });
  };

  healthCheck = (_req: Request, res: Response): void => {
    res.status(200).json({
      status: 'healthy',
      service: 'notification-service',
      timestamp: new Date().toISOString(),
    });
  };
}
