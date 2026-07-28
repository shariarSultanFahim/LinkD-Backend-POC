import { Request, Response } from 'express';
import { BaseController } from './BaseController';
import { AuthService } from '../services/AuthService';

export class AuthController extends BaseController {
  constructor(private authService: AuthService) {
    super();
  }

  async signup(req: Request, res: Response): Promise<void> {
    try {
      const result = await this.authService.signup(req.body);
      this.handleSuccess(res, result, 201);
    } catch (error) {
      this.handleError(error, res, 'AuthController.signup');
    }
  }

  async login(req: Request, res: Response): Promise<void> {
    try {
      const result = await this.authService.login(req.body);
      this.handleSuccess(res, result, 200);
    } catch (error) {
      this.handleError(error, res, 'AuthController.login');
    }
  }

  async me(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user.userId;
      const user = await this.authService.getProfile(userId);
      this.handleSuccess(res, user, 200);
    } catch (error) {
      this.handleError(error, res, 'AuthController.me');
    }
  }
}
