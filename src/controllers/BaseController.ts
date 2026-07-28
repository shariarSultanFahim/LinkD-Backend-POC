import { Response } from 'express';

export abstract class BaseController {
  protected handleSuccess<T>(res: Response, data: T, statusCode = 200): void {
    res.status(statusCode).json(data);
  }

  protected handleError(error: any, res: Response, context?: string): void {
    const statusCode = error.statusCode || 500;
    const message = error.message || 'Internal Server Error';
    
    if (process.env.NODE_ENV !== 'production' && statusCode === 500) {
      console.error(`[${context || 'ControllerError'}]`, error);
    }

    res.status(statusCode).json({
      error: error.name || 'API_ERROR',
      message,
    });
  }
}
