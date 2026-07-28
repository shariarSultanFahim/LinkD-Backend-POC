import { Socket } from 'socket.io';
import { verifyToken, JwtPayload } from '../utils/jwt';

export interface AuthenticatedSocket extends Socket {
  user?: JwtPayload;
}

export function socketAuthMiddleware(
  socket: AuthenticatedSocket,
  next: (err?: Error) => void
): void {
  const token = socket.handshake.auth?.token || socket.handshake.headers?.authorization?.replace('Bearer ', '');

  if (!token) {
    return next(new Error('Authentication error: Token missing'));
  }

  try {
    const payload = verifyToken(token);
    socket.user = payload;
    next();
  } catch (err) {
    next(new Error('Authentication error: Invalid token'));
  }
}
