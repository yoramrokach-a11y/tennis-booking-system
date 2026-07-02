import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { UnauthorizedError, ForbiddenError } from '../utils/errors';

/**
 * Decoded payload shape from JWT session token.
 */
export interface TokenPayload {
  id: number;
  email: string;
  role: 'PLAYER' | 'STAFF' | 'ADMIN';
  name: string;
}

/**
 * Custom request wrapper indicating authenticated session presence.
 */
export interface AuthenticatedRequest extends Request {
  user?: TokenPayload;
}

// Global Namespace Augment so standard Express handlers compiled under strict rules are happy
declare global {
  namespace Express {
    interface Request {
      user?: TokenPayload;
    }
  }
}

/**
 * JWT Authentication Middleware
 * Validates 'Bearer <Token>' headers, extracts claims, and binds them to the Request.
 */
export function authenticateToken(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new UnauthorizedError('Access unauthorized. Bearer token is missing.');
  }

  const token = authHeader.split(' ')[1];
  const jwtSecret = process.env.JWT_SECRET || 'super-secure-tennis-secret-key-change-in-prod';

  try {
    const decoded = jwt.verify(token, jwtSecret) as TokenPayload;
    req.user = decoded; // Bind session to request context
    next();
  } catch (err: any) {
    if (err.name === 'TokenExpiredError') {
      throw new UnauthorizedError('Session has expired. Please login again.');
    }
    throw new UnauthorizedError('Forbidden. Session token is invalid or tampered.');
  }
}

/**
 * Authorization Middleware Factory
 * Restricts access based on user role assignments.
 */
export function requireRole(...allowedRoles: Array<'PLAYER' | 'STAFF' | 'ADMIN'>) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      throw new UnauthorizedError('Access unauthorized. Authentication required.');
    }

    if (!allowedRoles.includes(req.user.role)) {
      throw new ForbiddenError(
        `Access forbidden. Requires one of the following roles: [${allowedRoles.join(', ')}]. Current: ${req.user.role}`
      );
    }

    next();
  };
}
