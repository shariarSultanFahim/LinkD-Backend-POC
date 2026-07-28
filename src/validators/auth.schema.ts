import { Request, Response, NextFunction } from 'express';
import { z, ZodSchema } from 'zod';

export const signupSchema = z.object({
  username: z.string().min(3).max(30),
  email: z.string().email(),
  password: z.string().min(6),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const roomCodeParamSchema = z.object({
  roomCode: z.string().length(6),
});

export function validateBody(schema: ZodSchema) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      res.status(400).json({
        error: 'VALIDATION_ERROR',
        details: result.error.errors,
      });
      return;
    }
    req.body = result.data;
    next();
  };
}

export function validateParams(schema: ZodSchema) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.params);
    if (!result.success) {
      res.status(400).json({
        error: 'VALIDATION_ERROR',
        details: result.error.errors,
      });
      return;
    }
    req.params = result.data;
    next();
  };
}
