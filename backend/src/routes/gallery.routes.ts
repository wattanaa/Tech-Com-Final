import { Router } from 'express';
import { prisma } from '../config/database.js';
import { authGuard } from '../middleware/auth.middleware.js';
import { requirePermission } from '../middleware/rbac.middleware.js';
import { validate } from '../middleware/validate.middleware.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { sendCreated, sendNoContent, sendSuccess } from '../utils/ApiResponse.js';
import { ApiError } from '../utils/ApiError.js';
import {
  addGalleryImagesSchema,
  reorderSchema,
  updateGalleryImageSchema,
} from '../validators/site.validators.js';
import { writeAuditLog } from '../services/audit.service.js';

const publicRouter = Router();
const adminRouter = Router();

const imageSelect = {
  id: true,
  caption: true,
  order: true,
  media: {
    select: { id: true, url: true, thumbnailUrl: true, alt: true, width: true, height: true, mimeType: true },
  },
} as const;

/** GET /api/v1/gallery — อัลบั้มที่เผยแพร่แล้วทั้งหมดพร้อมภาพ สำหรับหน้าคลังภาพและ section คลังภาพหน้าแรก */
publicRouter.get(
  '/',
  asyncHandler(async (_req, res) => {
    const albums = await prisma.album.findMany({
      where: { isPublished: true, deletedAt: null },
      orderBy: { eventDate: 'desc' },
      include: {
        coverImage: { select: { id: true, url: true, thumbnailUrl: true, alt: true } },
        images: { select: imageSelect, orderBy: { order: 'asc' } },
      },
    });
    sendSuccess(res, albums);
  }),
);

/** GET /api/v1/gallery/:slug — ภาพทั้งหมดในอัลบั้ม สำหรับหน้า Lightbox */
publicRouter.get(
  '/:slug',
  asyncHandler(async (req, res) => {
    const album = await prisma.album.findFirst({
      where: { slug: String(req.params.slug), isPublished: true, deletedAt: null },
      include: {
        coverImage: { select: { id: true, url: true, thumbnailUrl: true, alt: true } },
        images: { select: imageSelect, orderBy: { order: 'asc' } },
      },
    });
    if (!album) throw ApiError.notFound('ไม่พบอัลบั้มที่ต้องการ');
    sendSuccess(res, album);
  }),
);

// ── หลังบ้าน ────────────────────────────────────────────────
adminRouter.use(authGuard);

adminRouter.get(
  '/:albumId/images',
  requirePermission('gallery:read'),
  asyncHandler(async (req, res) => {
    const images = await prisma.galleryImage.findMany({
      where: { albumId: String(req.params.albumId) },
      select: imageSelect,
      orderBy: { order: 'asc' },
    });
    sendSuccess(res, images);
  }),
);

/** เพิ่มภาพจากคลังไฟล์เข้าอัลบั้มทีละหลายภาพ */
adminRouter.post(
  '/:albumId/images',
  requirePermission('gallery:update'),
  validate(addGalleryImagesSchema),
  asyncHandler(async (req, res) => {
    const albumId = String(req.params.albumId);
    const { mediaIds } = req.body as { mediaIds: string[] };

    const album = await prisma.album.findFirst({ where: { id: albumId, deletedAt: null } });
    if (!album) throw ApiError.notFound('ไม่พบอัลบั้มที่ต้องการ');

    const last = await prisma.galleryImage.findFirst({
      where: { albumId },
      orderBy: { order: 'desc' },
      select: { order: true },
    });
    let order = last?.order ?? 0;

    const created = await prisma.$transaction(async (tx) => {
      const rows = [];
      for (const mediaId of mediaIds) {
        order += 1;
        // ภาพเดียวกันใส่อัลบั้มเดิมซ้ำไม่ได้ — ข้ามไปเงียบ ๆ ดีกว่าขึ้น error ทั้งชุด
        const exists = await tx.galleryImage.findUnique({
          where: { albumId_mediaId: { albumId, mediaId } },
        });
        if (exists) continue;
        rows.push(await tx.galleryImage.create({ data: { albumId, mediaId, order } }));
      }
      await writeAuditLog(
        req,
        {
          action: 'UPDATE',
          entity: 'Album',
          entityId: albumId,
          note: `เพิ่มภาพ ${rows.length} ภาพ`,
        },
        tx,
      );
      return rows;
    });

    sendCreated(res, { added: created.length, skipped: mediaIds.length - created.length });
  }),
);

adminRouter.patch(
  '/images/:id',
  requirePermission('gallery:update'),
  validate(updateGalleryImageSchema),
  asyncHandler(async (req, res) => {
    const { caption } = req.body as { caption?: string | null };
    const updated = await prisma.galleryImage.update({
      where: { id: String(req.params.id) },
      data: { caption: caption ?? null },
      select: imageSelect,
    });
    sendSuccess(res, updated);
  }),
);

adminRouter.delete(
  '/images/:id',
  requirePermission('gallery:delete'),
  asyncHandler(async (req, res) => {
    const id = String(req.params.id);
    const image = await prisma.galleryImage.findUnique({ where: { id } });
    if (!image) throw ApiError.notFound('ไม่พบภาพที่ต้องการนำออก');

    // นำออกจากอัลบั้มเท่านั้น ไฟล์ต้นฉบับยังอยู่ในคลัง เผื่อนำไปใช้ที่อื่น
    await prisma.galleryImage.delete({ where: { id } });
    await writeAuditLog(req, {
      action: 'UPDATE',
      entity: 'Album',
      entityId: image.albumId,
      note: 'นำภาพออกจากอัลบั้ม',
    });
    sendNoContent(res);
  }),
);

/** จัดลำดับภาพใหม่หลังลากวาง */
adminRouter.patch(
  '/:albumId/reorder',
  requirePermission('gallery:update'),
  validate(reorderSchema),
  asyncHandler(async (req, res) => {
    const albumId = String(req.params.albumId);
    const { items } = req.body as { items: { id: string; order: number }[] };

    await prisma.$transaction(async (tx) => {
      for (const item of items) {
        await tx.galleryImage.update({
          where: { id: item.id },
          data: { order: item.order },
        });
      }
      await writeAuditLog(
        req,
        { action: 'UPDATE', entity: 'Album', entityId: albumId, note: 'จัดลำดับภาพใหม่' },
        tx,
      );
    });

    sendSuccess(res, { updated: items.length });
  }),
);

export { publicRouter as galleryPublicRouter, adminRouter as galleryAdminRouter };
