import { Request, Response, NextFunction } from 'express';

export function errorHandler(
  err: any,
  req: Request,
  res: Response,
  _next: NextFunction
): void {
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';

  if (process.env.NODE_ENV !== 'production') {
    console.error('Unhandled Error:', err);
  }

  res.status(statusCode).json({
    error: err.name || 'INTERNAL_ERROR',
    message,
  });
}
