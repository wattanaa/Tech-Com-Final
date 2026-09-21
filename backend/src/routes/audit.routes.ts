import { Router } from 'express';
import { prisma } from '../config/database.js';
import { authGuard } from '../middleware/auth.middleware.js';
import { requirePermission } from '../middleware/rbac.middleware.js';
import { validate } from '../middleware/validate.middleware.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { buildMeta, sendSuccess } from '../utils/ApiResponse.js';
import { getSkip, listQuerySchema, type ListQuery } from '../utils/pagination.js';

const router = Router();
router.use(authGuard, requirePermission('audit:read'));

/**
 * GET /api/v1/admin/audit-logs
 * บันทึกการใช้งานเป็นหลักฐานย้อนหลัง จึงเป็น read-only ทั้งหมด
 * ไม่มี endpoint แก้ไขหรือลบ — ถ้าลบได้ก็ไม่ใช่หลักฐานอีกต่อไป
 */
router.get(
  '/',
  validate(listQuerySchema, 'query'),
  asyncHandler(async (req, res) => {
    const q = req.validatedQuery as ListQuery;

    const where = {
      ...(q.type ? { action: q.type as never } : {}),
      ...(q.status ? { entity: q.status } : {}),
      ...(q.search
        ? {
            OR: [
              { entity: { contains: q.search, mode: 'insensitive' as const } },
              { user: { name: { contains: q.search, mode: 'insensitive' as const } } },
            ],
          }
        : {}),
      ...(q.from || q.to
        ? {
            createdAt: {
              ...(q.from ? { gte: q.from } : {}),
              ...(q.to ? { lte: q.to } : {}),
            },
          }
        : {}),
    };

    const [items, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: getSkip(q.page, q.limit),
        take: q.limit,
        include: { user: { select: { id: true, name: true, email: true } } },
      }),
      prisma.auditLog.count({ where }),
    ]);

    sendSuccess(res, items, 200,buildMeta(q.page ?? 1, q.limit ?? 10, total));
  }),
);

/** ตัวเลือกสำหรับ dropdown กรองข้อมูล */
router.get(
  '/filters',
  asyncHandler(async (_req, res) => {
    const [entities, users] = await Promise.all([
      prisma.auditLog.groupBy({ by: ['entity'], _count: true, orderBy: { entity: 'asc' } }),
      prisma.user.findMany({
        where: { deletedAt: null },
        select: { id: true, name: true },
        orderBy: { name: 'asc' },
      }),
    ]);
    sendSuccess(res, {
      entities: entities.map((e) => ({ name: e.entity, count: e._count })),
      users,
      actions: ['CREATE', 'UPDATE', 'DELETE', 'LOGIN', 'LOGOUT', 'PUBLISH', 'UNPUBLISH', 'RESTORE'],
    });
  }),
);

export default router;
