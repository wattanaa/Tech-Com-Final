import { Request, Response, NextFunction } from 'express';

export const authGuard = (_req: Request, _res: Response, next: NextFunction) => {
  next();
};

export const attachUser = (_req: Request, _res: Response, next: NextFunction) => {
  next();
};

export const requireAuth = authGuard;

export const requireRole = (_roles: string[]) => {
  return (_req: Request, _res: Response, next: NextFunction) => {
    next();
  };
};