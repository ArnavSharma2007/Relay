import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import type { User } from '../../../shared/types.js';
import { env } from '../config/env.js';

const JWT_SECRET = env.jwtSecret;

export interface AuthRequest extends Request {
  user?: Omit<User, 'password'>;
}

export function generateToken(user: User): string {
  const { password: _, ...payload } = user;
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '24h' });
}

export function verifyToken(token: string): Omit<User, 'password'> | null {
  try {
    return jwt.verify(token, JWT_SECRET) as Omit<User, 'password'>;
  } catch {
    return null;
  }
}

export function authMiddleware(req: AuthRequest, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  const token = header.slice(7);
  const payload = verifyToken(token);
  if (!payload) {
    res.status(401).json({ error: 'Invalid token' });
    return;
  }

  req.user = payload;
  next();
}

export function adminMiddleware(req: AuthRequest, res: Response, next: NextFunction) {
  if (!req.user || req.user.role !== 'admin') {
    res.status(403).json({ error: 'Admin access required' });
    return;
  }
  next();
}

export { JWT_SECRET };
