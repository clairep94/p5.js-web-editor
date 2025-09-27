import { Request, Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../types';

export function isAuthenticated(
  req: Request,
  res: Response,
  next: NextFunction
): asserts req is AuthenticatedRequest {
  if (!req.user) {
    res.status(403).json({
      success: false,
      message: 'You must be logged in to perform this action.'
    });
    return;
  }
  next();
}
