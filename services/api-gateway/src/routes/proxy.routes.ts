import { Router } from 'express';
import proxy from 'express-http-proxy';
import { env } from '../config/env';

const router = Router();

// Proxy to user-auth-service (Port 3001)
router.use(
  '/api/auth',
  proxy(env.AUTH_SERVICE_URL, {
    proxyReqPathResolver: (req) => {
      return `/api/auth${req.url}`;
    },
  })
);

// Proxy to order-service (Port 3002)
router.use(
  '/api/orders',
  proxy(env.ORDER_SERVICE_URL, {
    proxyReqPathResolver: (req) => {
      return `/api/orders${req.url}`;
    },
  })
);

// Proxy to notification-service (Port 3003)
router.use(
  '/api/notifications',
  proxy(env.NOTIFICATION_SERVICE_URL, {
    proxyReqPathResolver: (req) => {
      return `/api/notifications${req.url}`;
    },
  })
);

// Proxy to payment-service (Port 3004)
router.use(
  '/api/payments',
  proxy(env.PAYMENT_SERVICE_URL, {
    proxyReqPathResolver: (req) => {
      return `/api/payments${req.url}`;
    },
  })
);

export default router;
