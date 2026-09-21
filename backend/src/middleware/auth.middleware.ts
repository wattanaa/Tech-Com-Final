import { Request, Response, NextFunction } from 'express';
import { ApiError } from '../utils/ApiError.js';
import { loadAuthUser } from '../services/auth.service.js';
import { asyncHandler } from '../utils/asyncHandler.js';

/**
 * โหลด req.user จาก session ทุก request — ต้องอยู่หลัง sessionMiddleware
 * และก่อน route ทุกตัวใน app.ts ผลลัพธ์คือ route ที่ไม่ต้อง login (public)
 * ก็ยังรู้ว่าใครล็อกอินอยู่ได้ถ้าต้องใช้ (เช่น personalize) โดยไม่ปฏิเสธ request
 */
export const attachUser = asyncHandler(async (req: Request, _res: Response, next: NextFunction) => {
  const userId = req.session.userId;
  if (!userId) return next();

  const user = await loadAuthUser(userId);
  if (!user) {
    // user ถูกลบ/ปิดใช้งานหลังจาก session ถูกสร้าง — เพิกถอน session ทิ้งไปเลย
    req.session.userId = undefined;
    return next();
  }

  req.user = user;
  next();
});

/** ด่านแรก — ต้อง login เท่านั้น ไม่สนสิทธิ์เฉพาะ ใช้กับ route ที่ต้อง login แต่ไม่ผูกกับ permission กลุ่มใดกลุ่มหนึ่ง (เช่น /auth/me, /admin/dashboard, /admin/notifications) */
export const authGuard = (req: Request, _res: Response, next: NextFunction) => {
  if (!req.user) {
    next(ApiError.unauthorized());
    return;
  }
  next();
};

export const requireAuth = authGuard;

/** จำกัดตาม roleName ตรงตัว — ใช้เมื่อ requirePermission/requireSuperAdmin ไม่พอ (ดู rbac.middleware.ts สำหรับกรณีทั่วไป) */
export const requireRole = (roles: string[]) => {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) {
      next(ApiError.unauthorized());
      return;
    }
    if (!roles.includes(req.user.roleName)) {
      next(ApiError.forbidden('บัญชีของคุณไม่มีสิทธิ์ดำเนินการนี้'));
      return;
    }
    next();
  };
};