import { Router } from 'express';
import { OrderController } from '../controllers/order.controller';
import { authenticateJWT, authorizeRoles } from '../middlewares/auth.middleware';
import { validateRequest } from '../middlewares/validate.middleware';
import { createOrderSchema, updateOrderStatusSchema } from '../utils/order.validation';

const router = Router();
const orderController = new OrderController();

router.get('/health', orderController.healthCheck);
router.post('/webhook/payment', orderController.handlePaymentWebhook);
router.post('/', authenticateJWT, validateRequest(createOrderSchema), orderController.createOrder);
router.get('/', authenticateJWT, orderController.getUserOrders);
router.get('/:id', authenticateJWT, orderController.getOrderById);
router.patch(
  '/:id/status',
  authenticateJWT,
  authorizeRoles('ADMIN'),
  validateRequest(updateOrderStatusSchema),
  orderController.updateStatus
);
router.patch('/:id/cancel', authenticateJWT, orderController.cancelOrder);

export default router;
