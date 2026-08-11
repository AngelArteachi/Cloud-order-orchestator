import nodemailer, { Transporter } from 'nodemailer';
import { redisSubscriber } from '../config/redis';
import { env } from '../config/env';
import { NotificationLog, OrderEventPayload } from '../types/notification.types';
import { buildOrderCreatedTemplate, buildOrderStatusUpdatedTemplate } from '../utils/emailTemplates';

export class NotificationService {
  private notificationHistory: NotificationLog[] = [];
  private transporter: Transporter | null = null;

  constructor() {
    this.initTransporter();
  }

  private async initTransporter(): Promise<void> {
    if (process.env.NODE_ENV === 'test') {
      return;
    }

    try {
      if (env.SMTP_HOST && env.SMTP_USER && env.SMTP_PASS) {
        this.transporter = nodemailer.createTransport({
          host: env.SMTP_HOST,
          port: env.SMTP_PORT || 587,
          secure: env.SMTP_PORT === 465,
          auth: {
            user: env.SMTP_USER,
            pass: env.SMTP_PASS,
          },
        });
        console.log('✉️ Custom SMTP Transporter initialized in notification-service');
      } else {
        // Create automatic Ethereal test account (Zero Config for Portfolio)
        const testAccount = await nodemailer.createTestAccount();
        this.transporter = nodemailer.createTransport({
          host: 'smtp.ethereal.email',
          port: 587,
          secure: false,
          auth: {
            user: testAccount.user,
            pass: testAccount.pass,
          },
        });
        console.log(`✉️ Ethereal Email Transporter initialized automatically (User: ${testAccount.user})`);
      }
    } catch (error) {
      console.error('⚠️ Could not initialize Nodemailer transporter:', error);
    }
  }

  public async handleEvent(payload: OrderEventPayload): Promise<NotificationLog> {
    const timestamp = new Date();
    const id = `notif-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    let subject = '';
    let textBody = '';
    let htmlBody = '';

    if (payload.event === 'ORDER_CREATED') {
      subject = `🎉 Order Confirmation #${payload.orderId}`;
      textBody = `Hello User ${payload.userId},\n\nYour order #${payload.orderId} for $${payload.totalAmount?.toFixed(
        2
      )} has been placed successfully.\nShipping Address: ${payload.shippingAddress}`;

      htmlBody = buildOrderCreatedTemplate(payload);
    } else if (payload.event === 'ORDER_STATUS_UPDATED') {
      subject = `📦 Order #${payload.orderId} Status Update: ${payload.status}`;
      textBody = `Hello User ${payload.userId},\n\nYour order #${payload.orderId} status has been updated to: ${payload.status}.`;

      htmlBody = buildOrderStatusUpdatedTemplate(payload);
    } else {
      subject = `Notification for Order #${payload.orderId}`;
      textBody = `Order event ${payload.event} processed.`;
      htmlBody = `<p>${textBody}</p>`;
    }

    let previewUrl: string | undefined;

    if (this.transporter && process.env.NODE_ENV !== 'test') {
      try {
        const info = await this.transporter.sendMail({
          from: env.SMTP_FROM,
          to: `user-${payload.userId}@example.com`,
          subject,
          text: textBody,
          html: htmlBody,
        });

        const etherealUrl = nodemailer.getTestMessageUrl(info);
        if (etherealUrl) {
          previewUrl = etherealUrl;
        }
      } catch (err) {
        console.error('⚠️ Could not send email via Nodemailer:', err);
      }
    }

    const log: NotificationLog = {
      id,
      event: payload.event,
      orderId: payload.orderId,
      userId: payload.userId,
      subject,
      body: textBody,
      previewUrl,
      sentAt: timestamp,
    };

    this.notificationHistory.push(log);

    console.log(`\n--------------------------------------------------`);
    console.log(`✉️ [EMAIL DISPATCHED - notification-service]`);
    console.log(`TO: User ${payload.userId}`);
    console.log(`SUBJECT: ${subject}`);
    if (previewUrl) {
      console.log(`🔗 LIVE EMAIL PREVIEW URL: ${previewUrl}`);
    }
    console.log(`--------------------------------------------------\n`);

    return log;
  }

  public getNotificationLogs(): NotificationLog[] {
    return this.notificationHistory;
  }

  public async subscribeToEvents(): Promise<void> {
    try {
      if (redisSubscriber.status === 'wait') {
        await redisSubscriber.connect();
      }

      await redisSubscriber.subscribe('order:events');
      console.log('📡 Subscribed to Redis channel: order:events');

      redisSubscriber.on('message', async (channel: string, message: string) => {
        if (channel === 'order:events') {
          try {
            const payload: OrderEventPayload = JSON.parse(message);
            await this.handleEvent(payload);
          } catch (err) {
            console.error('⚠️ Error parsing Pub/Sub message in notification-service:', err);
          }
        }
      });
    } catch (error) {
      if (process.env.NODE_ENV !== 'test') {
        console.error('⚠️ Could not subscribe notification-service to Redis Pub/Sub:', error);
      }
    }
  }
}
