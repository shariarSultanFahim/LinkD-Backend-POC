import jwt from 'jsonwebtoken';
import { config } from '../config/unifiedConfig';

export interface JwtPayload {
  userId: string;
  email: string;
  username: string;
}

export function generateToken(payload: JwtPayload): string {
  return jwt.sign(payload, config.auth.jwtSecret, {
    expiresIn: config.auth.jwtExpiresIn as jwt.SignOptions['expiresIn'],
  });
}

export function verifyToken(token: string): JwtPayload {
  return jwt.verify(token, config.auth.jwtSecret) as JwtPayload;
}
