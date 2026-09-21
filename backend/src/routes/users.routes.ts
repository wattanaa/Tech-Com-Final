import { Router } from 'express';
import { prisma } from '../config/database.js';
import { authGuard } from '../middleware/auth.middleware.js';
import { requireSuperAdmin } from '../middleware/rbac.middleware.js';
import { validate } from '../middleware/validate.middleware.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { buildMeta, sendCreated, sendNoContent, sendSuccess } from '../utils/ApiResponse.js';
import { ApiError } from '../utils/ApiError.js';
import { createUserSchema, updateUserSchema } from '../validators/auth.validators.js';
import { hashPassword } from '../utils/password.js';
import { writeAuditLog } from '../services/audit.service.js';
import { getSkip, listQuerySchema, type ListQuery } from '../utils/pagination.js';

const router = Router();

// จัดการผู้ใช้เป็นสิทธิ์ที่อ่อนไหวที่สุดในระบบ — จำกัดไว้ที่ SUPER_ADMIN เท่านั้น
router.use(authGuard, requireSuperAdmin);

/** ไม่ส่ง passwordHash ออกไปไม่ว่ากรณีใด */
const publicUserSelect = {
  id: true,
  email: true,
  name: true,
  phone: true,
  isActive: true,
  lastLoginAt: true,
  createdAt: true,
  lockedUntil: true,
  role: { select: { id: true, name: true, label: true, level: true } },
  avatar: { select: { id: true, url: true, thumbnailUrl: true } },
} as const;

router.get(
  '/',
  validate(listQuerySchema, 'query'),
  asyncHandler(async (req, res) => {
    const q = req.validatedQuery as ListQuery;
    const where = {
      deletedAt: null,
      ...(q.search
        ? {
            OR: [
              { name: { contains: q.search, mode: 'insensitive' as const } },
              { email: { contains: q.search, mode: 'insensitive' as const } },
            ],
          }
        : {}),
    };

    const [items, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: publicUserSelect,
        orderBy: { createdAt: 'desc' },
        skip: getSkip(q.page, q.limit),
        take: q.limit,
      }),
      prisma.user.count({ where }),
    ]);

    sendSuccess(res, items, 200, buildMeta(q.page ?? 1, q.limit ?? 10, total));
  }),
);

/** รายชื่อบทบาทพร้อมสิทธิ์ สำหรับหน้าจอกำหนดสิทธิ์ */
router.get(
  '/roles',
  asyncHandler(async (_req, res) => {
    const roles = await prisma.role.findMany({
      orderBy: { level: 'desc' },
      include: {
        permissions: { include: { permission: { select: { key: true, label: true, group: true } } } },
        _count: { select: { users: true } },
      },
    });
    sendSuccess(
      res,
      roles.map((r) => ({
        id: r.id,
        name: r.name,
        label: r.label,
        description: r.description,
        level: r.level,
        userCount: r._count.users,
        permissions: r.permissions.map((rp) => rp.permission),
      })),
    );
  }),
);

router.post(
  '/',
  validate(createUserSchema),
  asyncHandler(async (req, res) => {
    const body = req.body as {
      email: string;
      name: string;
      password: string;
      roleId: string;
      phone?: string | null;
      isActive: boolean;
    };

    const exists = await prisma.user.findUnique({ where: { email: body.email } });
    if (exists) throw ApiError.conflict('อีเมลนี้ถูกใช้งานแล้ว');

    const created = await prisma.user.create({
      data: {
        email: body.email,
        name: body.name,
        passwordHash: await hashPassword(body.password),
        roleId: body.roleId,
        phone: body.phone ?? null,
        isActive: body.isActive,
      },
      select: publicUserSelect,
    });

    await writeAuditLog(req, {
      action: 'CREATE',
      entity: 'User',
      entityId: created.id,
      after: { email: created.email, name: created.name, role: created.role.name },
    });

    sendCreated(res, created);
  }),
);

router.put(
  '/:id',
  validate(updateUserSchema),
  asyncHandler(async (req, res) => {
    const id = String(req.params.id);
    const body = req.body as {
      name?: string;
      roleId?: string;
      phone?: string | null;
      isActive?: boolean;
      newPassword?: string;
    };

    const before = await prisma.user.findFirst({ where: { id, deletedAt: null } });
    if (!before) throw ApiError.notFound('ไม่พบผู้ใช้รายนี้');

    // กันไม่ให้ผู้ดูแลลดสิทธิ์หรือปิดบัญชีตัวเองจนไม่มีใครเข้าระบบได้
    if (id === req.user!.id) {
      if (body.isActive === false) throw ApiError.badRequest('ปิดใช้งานบัญชีของตนเองไม่ได้');
      if (body.roleId && body.roleId !== before.roleId) {
        throw ApiError.badRequest('เปลี่ยนบทบาทของตนเองไม่ได้ ให้ผู้ดูแลท่านอื่นเป็นผู้เปลี่ยนให้');
      }
    }

    const updated = await prisma.user.update({
      where: { id },
      data: {
        ...(body.name ? { name: body.name } : {}),
        ...(body.roleId ? { roleId: body.roleId } : {}),
        ...(body.phone !== undefined ? { phone: body.phone } : {}),
        ...(body.isActive !== undefined ? { isActive: body.isActive } : {}),
        ...(body.newPassword ? { passwordHash: await hashPassword(body.newPassword) } : {}),
        // ตั้งรหัสผ่านใหม่แล้วปลดล็อกบัญชีให้ด้วย เพราะมักตั้งใหม่เพราะลืมจนโดนล็อก
        ...(body.newPassword ? { failedLoginCount: 0, lockedUntil: null } : {}),
      },
      select: publicUserSelect,
    });

    await writeAuditLog(req, {
      action: 'UPDATE',
      entity: 'User',
      entityId: id,
      before: { name: before.name, roleId: before.roleId, isActive: before.isActive },
      after: { name: updated.name, roleId: updated.role.id, isActive: updated.isActive },
      note: body.newPassword ? 'ผู้ดูแลตั้งรหัสผ่านใหม่ให้' : undefined,
    });

    sendSuccess(res, updated);
  }),
);

router.delete(
  '/:id',
  asyncHandler(async (req, res) => {
    const id = String(req.params.id);
    if (id === req.user!.id) throw ApiError.badRequest('ลบบัญชีของตนเองไม่ได้');

    const before = await prisma.user.findFirst({ where: { id, deletedAt: null } });
    if (!before) throw ApiError.notFound('ไม่พบผู้ใช้รายนี้');

    const remaining = await prisma.user.count({
      where: { deletedAt: null, isActive: true, role: { name: 'SUPER_ADMIN' }, id: { not: id } },
    });
    if (remaining === 0) {
      throw ApiError.conflict('ต้องเหลือผู้ดูแลระบบสูงสุดอย่างน้อยหนึ่งบัญชีเสมอ');
    }

    // ปิดบัญชีพร้อม soft delete — ข่าวที่เคยเขียนไว้ยังอ้างถึงผู้เขียนได้อยู่
    await prisma.user.update({
      where: { id },
      data: { deletedAt: new Date(), isActive: false },
    });

    await writeAuditLog(req, { action: 'DELETE', entity: 'User', entityId: id, before });
    sendNoContent(res);
  }),
);

export default router;
