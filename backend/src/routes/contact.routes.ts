import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { NotificationType } from '@prisma/client';
import { prisma } from '../config/database.js';
import { validate } from '../middleware/validate.middleware.js';
import { authGuard } from '../middleware/auth.middleware.js';
import { requirePermission } from '../middleware/rbac.middleware.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { buildMeta, sendCreated, sendNoContent, sendSuccess } from '../utils/ApiResponse.js';
import { ApiError } from '../utils/ApiError.js';
import { contactMessageSchema } from '../validators/site.validators.js';
import { listQuerySchema, getSkip, type ListQuery } from '../utils/pagination.js';
import { writeAuditLog } from '../services/audit.service.js';
import { ROLE_LEVEL } from '../config/constants.js';

const publicRouter = Router();
const adminRouter = Router();

/** ส่งข้อความได้ไม่เกิน 3 ครั้งต่อชั่วโมงต่อ IP — พอสำหรับคนจริง แต่กันสแปมยิงรัว */
const contactLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 3,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req, _res, next) =>
    next(
      ApiError.tooManyRequests(
        'ส่งข้อความบ่อยเกินไป กรุณารอสักครู่ หรือติดต่อแผนกวิชาทางโทรศัพท์',
      ),
    ),
});

/** POST /api/v1/contact — ฟอร์มติดต่อจากหน้าเว็บ */
publicRouter.post(
  '/',
  contactLimiter,
  validate(contactMessageSchema),
  asyncHandler(async (req, res) => {
    const body = req.body as {
      name: string;
      email: string;
      phone?: string | null;
      subject: string;
      message: string;
    };

    const created = await prisma.contactMessage.create({
      data: {
        name: body.name,
        email: body.email,
        phone: body.phone ?? null,
        subject: body.subject,
        message: body.message,
        ipAddress: req.ip ?? null,
      },
    });

    // แจ้งเตือนผู้ดูแลทุกคนที่มีสิทธิ์อ่านข้อความ
    const admins = await prisma.user.findMany({
      where: { isActive: true, deletedAt: null, role: { level: { gte: ROLE_LEVEL.ADMIN } } },
      select: { id: true },
    });
    if (admins.length > 0) {
      await prisma.notification.createMany({
        data: admins.map((a) => ({
          userId: a.id,
          type: NotificationType.CONTACT_MESSAGE,
          title: 'มีข้อความติดต่อใหม่',
          message: `${body.name}: ${body.subject}`,
          link: '/admin/messages',
        })),
      });
    }

    sendCreated(res, { id: created.id, message: 'ส่งข้อความเรียบร้อยแล้ว แผนกวิชาจะติดต่อกลับโดยเร็ว' });
  }),
);

// ── หลังบ้าน ────────────────────────────────────────────────
adminRouter.use(authGuard);

adminRouter.get(
  '/',
  requirePermission('message:read'),
  validate(listQuerySchema, 'query'),
  asyncHandler(async (req, res) => {
    const q = req.validatedQuery as ListQuery;
    const where = {
      deletedAt: null,
      ...(q.search
        ? {
            OR: [
              { name: { contains: q.search, mode: 'insensitive' as const } },
              { subject: { contains: q.search, mode: 'insensitive' as const } },
              { message: { contains: q.search, mode: 'insensitive' as const } },
            ],
          }
        : {}),
      ...(q.status === 'unread' ? { isRead: false } : {}),
    };

    const [items, total, unread] = await Promise.all([
      prisma.contactMessage.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: getSkip(q.page, q.limit),
        take: q.limit,
      }),
      prisma.contactMessage.count({ where }),
      prisma.contactMessage.count({ where: { deletedAt: null, isRead: false } }),
    ]);

    sendSuccess(res, { items, unread }, 200,buildMeta(q.page ?? 1, q.limit ?? 10, total));
  }),
);

adminRouter.patch(
  '/:id/read',
  requirePermission('message:read'),
  asyncHandler(async (req, res) => {
    const updated = await prisma.contactMessage.update({
      where: { id: String(req.params.id) },
      data: { isRead: true },
    });
    sendSuccess(res, updated);
  }),
);

adminRouter.delete(
  '/:id',
  requirePermission('message:delete'),
  asyncHandler(async (req, res) => {
    const id = String(req.params.id);
    const before = await prisma.contactMessage.findUnique({ where: { id } });
    if (!before) throw ApiError.notFound('ไม่พบข้อความนี้');

    await prisma.contactMessage.update({ where: { id }, data: { deletedAt: new Date() } });
    await writeAuditLog(req, {
      action: 'DELETE',
      entity: 'ContactMessage',
      entityId: id,
      before,
    });
    sendNoContent(res);
  }),
);

export { publicRouter as contactPublicRouter, adminRouter as contactAdminRouter };
