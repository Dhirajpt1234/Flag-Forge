import type { Request, Response, NextFunction } from 'express';

export interface ApiError extends Error {
  statusCode?: number;
  code?: string;
}

export class ValidationError extends Error implements ApiError {
  statusCode = 400;
  code = 'VALIDATION_ERROR';
  
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

export class NotFoundError extends Error implements ApiError {
  statusCode = 404;
  code = 'NOT_FOUND_ERROR';
  
  constructor(message: string) {
    super(message);
    this.name = 'NotFoundError';
  }
}

export class ConflictError extends Error implements ApiError {
  statusCode = 409;
  code = 'CONFLICT_ERROR';
  
  constructor(message: string) {
    super(message);
    this.name = 'ConflictError';
  }
}

export class DatabaseError extends Error implements ApiError {
  statusCode = 500;
  code = 'DATABASE_ERROR';
  
  constructor(message: string) {
    super(message);
    this.name = 'DatabaseError';
  }
}

export const exceptionHandler = (
  error: ApiError,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const statusCode = error.statusCode || 500;
  const code = error.code || 'INTERNAL_SERVER_ERROR';
  const message = error.message || 'An unexpected error occurred';

  // Log the error for debugging
  console.error(`[${new Date().toISOString()}] ${req.method} ${req.path}:`, {
    error: error.message,
    stack: error.stack,
    statusCode,
    code,
    body: req.body,
    params: req.params,
    query: req.query
  });

  // Send standardized error response
  res.status(statusCode).json({
    success: false,
    error: {
      code,
      message,
      ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
    },
    timestamp: new Date().toISOString(),
    path: req.path
  });
};

export const asyncHandler = (fn: (req: Request, res: Response, next: NextFunction) => Promise<void>) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};
