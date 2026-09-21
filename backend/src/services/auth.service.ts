import type { Request } from 'express';
import { prisma } from '../config/database.js';
import { ApiError } from '../utils/ApiError.js';
import { hashPassword, needsRehash, verifyPassword } from '../utils/password.js';
import { writeAuditLog } from './audit.service.js';
import { ACCOUNT_LOCK } from '../config/constants.js';
import { logger } from '../utils/logger.js';
import type { AuthUser } from '../types/express.js';

const userWithRole = {
  role: { include: { permissions: { include: { permission: true } } } },
  avatar: { select: { id: true, url: true, thumbnailUrl: true } },
} as const;

/**
 * โหลดผู้ใช้จาก userId ใน session แล้วแปลงเป็น AuthUser — ใช้ทั้งตอน login
 * และตอน rehydrate req.user ใน attachUser (ต้อง query ทุก request เพราะ
 * permission/role อาจเปลี่ยนระหว่างที่ session ยังไม่หมดอายุ)
 */
export async function loadAuthUser(userId: string): Promise<AuthUser | null> {
  const user = await prisma.user.findFirst({
    where: { id: userId, deletedAt: null, isActive: true },
    include: userWithRole,
  });
  if (!user) return null;

  return {
    id: user.id,
    email: user.email,
    name: user.name,
    roleName: user.role.name,
    roleLevel: user.role.level,
    permissions: user.role.permissions.map((rp) => rp.permission.key),
  };
}

/** ข้อความเดียวกันทั้งกรณีอีเมลผิดและรหัสผ่านผิด — ไม่บอกใบ้ว่าบัญชีไหนมีอยู่จริง */
const INVALID_CREDENTIALS = 'อีเมลหรือรหัสผ่านไม่ถูกต้อง';

export async function login(req: Request, email: string, password: string): Promise<AuthUser> {
  const user = await prisma.user.findFirst({
    where: { email, deletedAt: null },
    include: userWithRole,
  });

  if (!user) {
    // เสียเวลาเท่ากับการตรวจรหัสผ่านจริง เพื่อไม่ให้จับเวลาแล้วเดาได้ว่าอีเมลนี้มีในระบบ
    await verifyPassword('$argon2id$v=19$m=19456,t=2,p=1$aaaaaaaaaaaaaaaa$aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa', password);
    throw ApiError.unauthorized(INVALID_CREDENTIALS);
  }

  if (!user.isActive) {
    throw ApiError.forbidden('บัญชีนี้ถูกระงับการใช้งาน กรุณาติดต่อผู้ดูแลระบบ');
  }

  if (user.lockedUntil && user.lockedUntil > new Date()) {
    const minutes = Math.ceil((user.lockedUntil.getTime() - Date.now()) / 60_000);
    throw ApiError.tooManyRequests(
      `กรอกรหัสผ่านผิดหลายครั้งเกินไป บัญชีถูกล็อกชั่วคราว กรุณารออีก ${minutes} นาที`,
    );
  }

  const ok = await verifyPassword(user.passwordHash, password);

  if (!ok) {
    const failed = user.failedLoginCount + 1;
    const shouldLock = failed >= ACCOUNT_LOCK.MAX_FAILED_ATTEMPTS;
    await prisma.user.update({
      where: { id: user.id },
      data: {
        failedLoginCount: failed,
        lockedUntil: shouldLock
          ? new Date(Date.now() + ACCOUNT_LOCK.LOCK_MINUTES * 60_000)
          : null,
      },
    });
    if (shouldLock) {
      logger.warn({ userId: user.id, ip: req.ip }, 'ล็อกบัญชีชั่วคราวจากการกรอกรหัสผ่านผิดซ้ำ');
    }
    throw ApiError.unauthorized(INVALID_CREDENTIALS);
  }

  // อัปเกรด hash ถ้าพารามิเตอร์เปลี่ยนไปจากตอนที่ตั้งรหัสผ่านครั้งแรก
  if (needsRehash(user.passwordHash)) {
    await prisma.user
      .update({ where: { id: user.id }, data: { passwordHash: await hashPassword(password) } })
      .catch(() => undefined);
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { failedLoginCount: 0, lockedUntil: null, lastLoginAt: new Date() },
  });

  // สร้าง session id ใหม่หลังล็อกอินสำเร็จ — ปิดช่อง session fixation
  await regenerateSession(req);
  req.session.userId = user.id;
  req.session.loginAt = Date.now();

  const authUser: AuthUser = {
    id: user.id,
    email: user.email,
    name: user.name,
    roleName: user.role.name,
    roleLevel: user.role.level,
    permissions: user.role.permissions.map((rp) => rp.permission.key),
  };
  req.user = authUser;

  await writeAuditLog(req, { action: 'LOGIN', entity: 'User', entityId: user.id });
  return authUser;
}

export async function logout(req: Request): Promise<void> {
  if (req.user) {
    await writeAuditLog(req, { action: 'LOGOUT', entity: 'User', entityId: req.user.id });
  }
  await new Promise<void>((resolve, reject) => {
    req.session.destroy((err) => (err ? reject(err) : resolve()));
  });
}

/** ข้อมูลผู้ใช้ปัจจุบันพร้อมสิทธิ์ — Frontend ใช้ตัดสินใจว่าจะแสดงเมนูใดบ้าง */
export async function getCurrentUser(userId: string) {
  const user = await prisma.user.findFirst({
    where: { id: userId, deletedAt: null },
    include: userWithRole,
  });
  if (!user) throw ApiError.unauthorized();

  return {
    id: user.id,
    email: user.email,
    name: user.name,
    phone: user.phone,
    avatar: user.avatar,
    lastLoginAt: user.lastLoginAt,
    role: { name: user.role.name, label: user.role.label, level: user.role.level },
    permissions: user.role.permissions.map((rp) => rp.permission.key),
  };
}

export async function changePassword(
  req: Request,
  userId: string,
  currentPassword: string,
  newPassword: string,
): Promise<void> {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw ApiError.unauthorized();

  const ok = await verifyPassword(user.passwordHash, currentPassword);
  if (!ok) throw ApiError.validation({ currentPassword: 'รหัสผ่านเดิมไม่ถูกต้อง' });

  await prisma.user.update({
    where: { id: userId },
    data: { passwordHash: await hashPassword(newPassword) },
  });

  await writeAuditLog(req, {
    action: 'UPDATE',
    entity: 'User',
    entityId: userId,
    note: 'เปลี่ยนรหัสผ่าน',
  });
}

function regenerateSession(req: Request): Promise<void> {
  return new Promise((resolve, reject) => {
    req.session.regenerate((err) => (err ? reject(err) : resolve()));
  });
}
