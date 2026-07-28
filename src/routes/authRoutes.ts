import { Router } from 'express';
import { AuthController } from '../controllers/AuthController';
import { AuthService } from '../services/AuthService';
import { UserRepository } from '../repositories/UserRepository';
import { authMiddleware } from '../middleware/authMiddleware';
import { asyncErrorWrapper } from '../middleware/asyncErrorWrapper';
import { validateBody, signupSchema, loginSchema } from '../validators/auth.schema';

const userRepository = new UserRepository();
const authService = new AuthService(userRepository);
const authController = new AuthController(authService);

const router = Router();

router.post(
  '/signup',
  validateBody(signupSchema),
  asyncErrorWrapper((req, res) => authController.signup(req, res))
);

router.post(
  '/login',
  validateBody(loginSchema),
  asyncErrorWrapper((req, res) => authController.login(req, res))
);

router.get(
  '/me',
  authMiddleware,
  asyncErrorWrapper((req, res) => authController.me(req, res))
);

export default router;
