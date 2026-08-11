import { Router } from 'express';
import { PaymentController } from '../controllers/payment.controller';
import { PaymentService } from '../services/payment.service';

export const createPaymentRouter = (paymentService: PaymentService): Router => {
  const router = Router();
  const controller = new PaymentController(paymentService);

  router.get('/health', controller.healthCheck);
  router.post('/checkout', controller.checkout);
  router.get('/transactions', controller.getTransactions);

  return router;
};
