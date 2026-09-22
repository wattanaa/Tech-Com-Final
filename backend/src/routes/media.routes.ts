import { Router } from 'express';
import { NotificationType } from '@prisma/client';
import { prisma } from '../config/database.js';
import { authGuard } from '../middleware/auth.middleware.js';
import { requirePermission } from '../middleware/rbac.middleware.js';
import { validate } from '../middleware/validate.middleware.js';
import { uploadMiddleware } from '../middleware/upload.middleware.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { buildMeta, sendCreated, sendNoContent, sendSuccess } from '../utils/ApiResponse.js';
import { ApiError } from '../utils/ApiError.js';
import { deleteMedia, saveExternalVideo, saveUpload, type UploadedFile } from '../services/media.service.js';
import { writeAuditLog } from '../services/audit.service.js';
import { getSkip, listQuerySchema, type ListQuery } from '../utils/pagination.js';
import { ROLE_LEVEL } from '../config/constants.js';

const router = Router();
router.use(authGuard);

/** POST /api/v1/admin/media/upload — อัปโหลดได้ครั้งละหลายไฟล์ */
router.post(
  '/upload',
  requirePermission('media:create'),
  uploadMiddleware.array('files', 10),
  asyncHandler(async (req, res) => {
    const files = (req.files as UploadedFile[] | undefined) ?? [];
    if (files.length === 0) throw ApiError.badRequest('กรุณาเลือกไฟล์ที่ต้องการอัปโหลด');

    const folder = typeof req.body?.folder === 'string' ? req.body.folder : 'general';
    const saved = [];
    const failed: { name: string; reason: string }[] = [];

    // ไฟล์ที่เสียหนึ่งไฟล์ไม่ควรทำให้ทั้งชุดล้มเหลว — รายงานเป็นรายไฟล์แทน
    for (const file of files) {
      try {
        saved.push(await saveUpload(file, req.user!.id, folder));
      } catch (err) {
        failed.push({
          name: file.originalname,
          reason: err instanceof ApiError ? err.message : 'ประมวลผลไฟล์ไม่สำเร็จ',
        });
      }
    }

    if (saved.length > 0) {
      await writeAuditLog(req, {
        action: 'CREATE',
        entity: 'Media',
        note: `อัปโหลด ${saved.length} ไฟล์`,
        after: { count: saved.length, folder },
      });

      const admins = await prisma.user.findMany({
        where: { isActive: true, deletedAt: null, role: { level: { gte: ROLE_LEVEL.ADMIN } } },
        select: { id: true },
      });
      if (admins.length > 0) {
        await prisma.notification.createMany({
          data: admins.map((a) => ({
            userId: a.id,
            type: NotificationType.MEDIA_UPLOAD,
            title: 'มีไฟล์อัปโหลดใหม่',
            message: `${req.user!.name} อัปโหลด ${saved.length} ไฟล์`,
            link: '/admin/media',
          })),
        });
      }
    }

    sendCreated(res, { uploaded: saved, failed });
  }),
);

/** POST /api/v1/admin/media/external-video — เพิ่มวิดีโอด้วยลิงก์ YouTube แทนการอัปโหลดไฟล์ */
router.post(
  '/external-video',
  requirePermission('media:create'),
  asyncHandler(async (req, res) => {
    const url = String(req.body?.url ?? '').trim();
    if (!url) throw ApiError.badRequest('กรุณาระบุลิงก์วิดีโอ');

    const media = await saveExternalVideo(url, req.user!.id);
    await writeAuditLog(req, {
      action: 'CREATE',
      entity: 'Media',
      entityId: media.id,
      note: 'เพิ่มวิดีโอ YouTube',
      after: { url },
    });
    sendCreated(res, media);
  }),
);

/** GET /api/v1/admin/media — คลังไฟล์ พร้อมค้นหาและกรองตามโฟลเดอร์ */
router.get(
  '/',
  requirePermission('media:read'),
  validate(listQuerySchema, 'query'),
  asyncHandler(async (req, res) => {
    const q = req.validatedQuery as ListQuery;
    const where = {
      deletedAt: null,
      ...(q.search
        ? {
            OR: [
              { originalName: { contains: q.search, mode: 'insensitive' as const } },
              { alt: { contains: q.search, mode: 'insensitive' as const } },
            ],
          }
        : {}),
      ...(q.type ? { folder: q.type } : {}),
    };

    const [items, total, folders] = await Promise.all([
      prisma.media.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: getSkip(q.page, q.limit),
        take: q.limit,
        include: { uploadedBy: { select: { id: true, name: true } } },
      }),
      prisma.media.count({ where }),
      prisma.media.groupBy({ by: ['folder'], where: { deletedAt: null }, _count: true }),
    ]);

    sendSuccess(
      res,
      { items, folders: folders.map((f) => ({ name: f.folder, count: f._count })) },
      200,
      buildMeta(q.page ?? 1, q.limit ?? 10, total),
    );
  }),
);

/** แก้ข้อความอธิบายภาพ (alt) — สำคัญต่อการเข้าถึงของผู้ใช้ screen reader */
router.patch(
  '/:id',
  requirePermission('media:update'),
  asyncHandler(async (req, res) => {
    const alt = String(req.body?.alt ?? '').slice(0, 200);
    const updated = await prisma.media.update({
      where: { id: String(req.params.id) },
      data: { alt },
    });
    sendSuccess(res, updated);
  }),
);

router.delete(
  '/:id',
  requirePermission('media:delete'),
  asyncHandler(async (req, res) => {
    const id = String(req.params.id);
    const media = await prisma.media.findUnique({ where: { id } });
    if (!media) throw ApiError.notFound('ไม่พบไฟล์ที่ต้องการลบ');

    // ผู้เขียนลบได้เฉพาะไฟล์ที่ตนอัปโหลดเอง
    if (req.user!.roleLevel <= ROLE_LEVEL.EDITOR && media.uploadedById !== req.user!.id) {
      throw ApiError.forbidden('คุณลบได้เฉพาะไฟล์ที่ตนเองอัปโหลด');
    }

    await deleteMedia(id);
    await writeAuditLog(req, { action: 'DELETE', entity: 'Media', entityId: id, before: media });
    sendNoContent(res);
  }),
);

export default router;
