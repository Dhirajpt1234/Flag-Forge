import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { UnauthorizedError } from './exceptionHandler.middleware';

export interface AuthenticatedRequest extends Request {
  user?: {
    userId: string;
    orgId: string;
    role: string;
  };
}

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production';

export const createAuthMiddleware = () => {
  return async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const authHeader = req.headers.authorization;
      
      if (!authHeader) {
        throw new UnauthorizedError('Authorization header required');
      }

      const token = authHeader.startsWith('Bearer ') 
        ? authHeader.slice(7) 
        : authHeader;

      if (!token) {
        throw new UnauthorizedError('Token required');
      }

      const decoded = jwt.verify(token, JWT_SECRET) as {
        userId: string;
        orgId: string;
        role: string;
      };
      
      req.user = {
        userId: decoded.userId,
        orgId: decoded.orgId,
        role: decoded.role,
      };

      next();
    } catch (error) {
      if (error instanceof UnauthorizedError) {
        return next(error);
      }
      
      if (error instanceof Error) {
        if (error.message.includes('expired')) {
          return next(new UnauthorizedError('Token expired'));
        }
        if (error.message.includes('invalid') || error.message.includes('verification')) {
          return next(new UnauthorizedError('Invalid token'));
        }
      }
      
      return next(new UnauthorizedError('Authentication failed'));
    }
  };
};

export default createAuthMiddleware;
