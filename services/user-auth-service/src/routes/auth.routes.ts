import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller';
import { validateRequest } from '../middlewares/validate.middleware';
import { authenticateJWT } from '../middlewares/auth.middleware';
import { loginSchema, registerSchema } from '../utils/auth.validation';

const router = Router();
const authController = new AuthController();

router.get('/health', authController.healthCheck);
router.post('/register', validateRequest(registerSchema), authController.register);
router.post('/login', validateRequest(loginSchema), authController.login);
router.get('/me', authenticateJWT, authController.getMe);

export default router;
