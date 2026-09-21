import { Router } from 'express';
import { prisma } from '../config/database.js';
import { authGuard } from '../middleware/auth.middleware.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { buildMeta, sendSuccess } from '../utils/ApiResponse.js';
import { validate } from '../middleware/validate.middleware.js';
import { getSkip, listQuerySchema, type ListQuery } from '../utils/pagination.js';

const router = Router();
router.use(authGuard);

/** การแจ้งเตือนเป็นของแต่ละคน จึงกรองด้วย userId ของผู้เรียกเสมอ ไม่รับ id จาก query */
router.get(
  '/',
  validate(listQuerySchema, 'query'),
  asyncHandler(async (req, res) => {
    const q = req.validatedQuery as ListQuery;
    const where = {
      userId: req.user!.id,
      ...(q.status === 'unread' ? { isRead: false } : {}),
    };

    const [items, total, unread] = await Promise.all([
      prisma.notification.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: getSkip(q.page, q.limit),
        take: q.limit,
      }),
      prisma.notification.count({ where }),
      prisma.notification.count({ where: { userId: req.user!.id, isRead: false } }),
    ]);

    sendSuccess(res, { items, unread }, 200, buildMeta(q.page ?? 1, q.limit ?? 10, total));
  }),
);

router.patch(
  '/:id/read',
  asyncHandler(async (req, res) => {
    // updateMany + เงื่อนไข userId — อ่านของคนอื่นไม่ได้แม้จะเดา id ถูก
    const result = await prisma.notification.updateMany({
      where: { id: String(req.params.id), userId: req.user!.id },
      data: { isRead: true, readAt: new Date() },
    });
    sendSuccess(res, { updated: result.count });
  }),
);

router.patch(
  '/read-all',
  asyncHandler(async (req, res) => {
    const result = await prisma.notification.updateMany({
      where: { userId: req.user!.id, isRead: false },
      data: { isRead: true, readAt: new Date() },
    });
    sendSuccess(res, { updated: result.count });
  }),
);

export default router;
