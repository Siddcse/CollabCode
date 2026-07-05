import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';

export interface AuthPayload {
  userId: string;
  username: string;
  guestToken: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthPayload;
    }
  }
}

export function authMiddleware(req: Request, res: Response, next: NextFunction): void {
  const token = req.headers.authorization?.replace('Bearer ', '');

  if (!token) {
    res.status(401).json({ success: false, error: 'No token provided' });
    return;
  }

  try {
    const payload = jwt.verify(token, env.JWT_SECRET) as AuthPayload;
    req.user = payload;
    next();
  } catch {
    res.status(401).json({ success: false, error: 'Invalid or expired token' });
  }
}

export function optionalAuth(req: Request, _res: Response, next: NextFunction): void {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (token) {
    try {
      req.user = jwt.verify(token, env.JWT_SECRET) as AuthPayload;
    } catch {}
  }
  next();
}

export function signToken(payload: AuthPayload): string {
  return jwt.sign(payload, env.JWT_SECRET, { expiresIn: env.JWT_EXPIRES_IN });
}
