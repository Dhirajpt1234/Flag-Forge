import type { Request, Response, NextFunction } from 'express';
import { UnauthorizedError } from './exceptionHandler.middleware';

export interface OrgContextRequest extends Request {
  user?: {
    userId: string;
    orgId: string;
    role: string;
  };
}

export const createOrgContextMiddleware = () => {
  return (req: OrgContextRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      return next(new UnauthorizedError('User not authenticated'));
    }

    let orgId = req.user.orgId;

    if (req.headers['x-organization-id']) {
      const requestedOrgId = req.headers['x-organization-id'] as string;
      
      if (requestedOrgId !== orgId) {
        return next(new UnauthorizedError('User is not a member of the requested organization'));
      }
      
      orgId = requestedOrgId;
    }

    req.user.orgId = orgId;
    next();
  };
};

export default createOrgContextMiddleware;
