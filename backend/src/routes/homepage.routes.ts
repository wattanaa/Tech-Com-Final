import { Router } from 'express';
import { Prisma } from '@prisma/client';
import { prisma } from '../config/database.js';
import { validate } from '../middleware/validate.middleware.js';
import { authGuard } from '../middleware/auth.middleware.js';
import { requirePermission } from '../middleware/rbac.middleware.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { sendSuccess } from '../utils/ApiResponse.js';
import { ApiError } from '../utils/ApiError.js';
import { reorderSectionsSchema, updateSectionSchema } from '../validators/cms.validators.js';
import { writeAuditLog } from '../services/audit.service.js';

const publicRouter = Router();
const adminRouter = Router();

/**
 * เติม config.backgroundMedia (url + mimeType) ให้ section ชนิด HERO ที่มี backgroundImageId
 * ทำเฉพาะ HERO เพราะเป็น section เดียวที่ config อ้างถึงไฟล์สื่อโดยตรงในตอนนี้ — ยังไม่คุ้มที่จะ
 * เขียน resolver แบบทั่วไปสำหรับทุก section type ที่ยังไม่มี pattern แบบนี้เลย
 */
async function withHeroBackgroundMedia<T extends { type: string; config: unknown }>(
  sections: T[],
): Promise<T[]> {
  const mediaIds = sections
    .filter((s) => s.type === 'HERO')
    .map((s) => (s.config as { backgroundImageId?: string } | null)?.backgroundImageId)
    .filter((id): id is string => Boolean(id));

  if (mediaIds.length === 0) return sections;

  const mediaRows = await prisma.media.findMany({
    where: { id: { in: mediaIds } },
    select: { id: true, url: true, mimeType: true },
  });
  const mediaById = new Map(mediaRows.map((m) => [m.id, m]));

  return sections.map((section) => {
    if (section.type !== 'HERO') return section;
    const bgId = (section.config as { backgroundImageId?: string } | null)?.backgroundImageId;
    const media = bgId ? mediaById.get(bgId) : undefined;
    if (!media) return section;
    return {
      ...section,
      config: { ...(section.config as Record<string, unknown>), backgroundMedia: { url: media.url, mimeType: media.mimeType } },
    };
  });
}

/**
 * GET /api/v1/homepage/sections
 * หน้าแรกเรียกเส้นทางนี้เส้นเดียวแล้วประกอบหน้าเองตามลำดับที่ได้มา
 * การสลับลำดับหรือซ่อน section จึงเปลี่ยนหน้าเว็บได้ทันทีโดยไม่ต้องแก้โค้ด
 */
publicRouter.get(
  '/sections',
  asyncHandler(async (_req, res) => {
    const sections = await prisma.homepageSection.findMany({
      where: { isVisible: true },
      orderBy: { order: 'asc' },
      select: { id: true, type: true, title: true, subtitle: true, order: true, config: true },
    });
    sendSuccess(res, await withHeroBackgroundMedia(sections));
  }),
);

// ── หลังบ้าน ────────────────────────────────────────────────
adminRouter.use(authGuard);

/** เห็นทุก section รวมที่ซ่อนอยู่ */
adminRouter.get(
  '/sections',
  requirePermission('homepage:read'),
  asyncHandler(async (_req, res) => {
    const sections = await prisma.homepageSection.findMany({ orderBy: { order: 'asc' } });
    sendSuccess(res, await withHeroBackgroundMedia(sections));
  }),
);

adminRouter.put(
  '/sections/:id',
  requirePermission('homepage:update'),
  validate(updateSectionSchema),
  asyncHandler(async (req, res) => {
    const id = String(req.params.id);
    const body = req.body as {
      title?: string | null;
      subtitle?: string | null;
      isVisible?: boolean;
      config?: Record<string, unknown>;
    };

    const before = await prisma.homepageSection.findUnique({ where: { id } });
    if (!before) throw ApiError.notFound('ไม่พบ section ที่ต้องการแก้ไข');

    // config ต้องเป็นชนิดเดียวกับ section — กันการส่งค่าของ Hero ไปใส่ใน News
    if (body.config && body.config.type !== before.type) {
      throw ApiError.badRequest(
        `ค่าตั้งที่ส่งมาเป็นของ section ชนิด ${String(body.config.type)} แต่ section นี้เป็นชนิด ${before.type}`,
      );
    }

    const updated = await prisma.$transaction(async (tx) => {
      const row = await tx.homepageSection.update({
        where: { id },
        data: {
          title: body.title ?? before.title,
          subtitle: body.subtitle ?? before.subtitle,
          isVisible: body.isVisible ?? before.isVisible,
          config: (body.config ?? before.config ?? {}) as Prisma.InputJsonValue,
          updatedById: req.user!.id,
        },
      });
      await writeAuditLog(
        req,
        { action: 'UPDATE', entity: 'HomepageSection', entityId: id, before, after: row },
        tx,
      );
      return row;
    });

    sendSuccess(res, updated);
  }),
);

/**
 * PATCH /api/v1/admin/homepage/reorder
 * รับลำดับใหม่ทั้งชุดแล้วบันทึกในทรานแซกชันเดียว
 * ถ้าอัปเดตทีละรายการแล้วพังกลางทาง ลำดับจะเพี้ยนค้างไว้ — ทรานแซกชันกันกรณีนั้น
 */
adminRouter.patch(
  '/reorder',
  requirePermission('homepage:update'),
  validate(reorderSectionsSchema),
  asyncHandler(async (req, res) => {
    const { items } = req.body as { items: { id: string; order: number }[] };

    await prisma.$transaction(async (tx) => {
      for (const item of items) {
        await tx.homepageSection.update({
          where: { id: item.id },
          data: { order: item.order, updatedById: req.user!.id },
        });
      }
      await writeAuditLog(
        req,
        {
          action: 'UPDATE',
          entity: 'HomepageSection',
          after: { order: items.map((i) => `${i.id}:${i.order}`) },
          note: 'จัดลำดับ section ใหม่',
        },
        tx,
      );
    });

    sendSuccess(res, await prisma.homepageSection.findMany({ orderBy: { order: 'asc' } }));
  }),
);

/**
 * ทำสำเนา section — เช่น อยากมีแถวข่าวสองแถว กรองคนละหมวด
 * สำเนาถูกวางต่อจากต้นฉบับทันที แล้วเลื่อนลำดับของตัวที่อยู่ถัดไปลงหนึ่งขั้น
 */
adminRouter.post(
  '/sections/:id/duplicate',
  requirePermission('homepage:update'),
  asyncHandler(async (req, res) => {
    const source = await prisma.homepageSection.findUnique({ where: { id: String(req.params.id) } });
    if (!source) throw ApiError.notFound('ไม่พบ section ที่ต้องการทำสำเนา');

    const copy = await prisma.$transaction(async (tx) => {
      await tx.homepageSection.updateMany({
        where: { order: { gt: source.order } },
        data: { order: { increment: 1 } },
      });
      const row = await tx.homepageSection.create({
        data: {
          type: source.type,
          title: source.title ? `${source.title} (สำเนา)` : null,
          subtitle: source.subtitle,
          order: source.order + 1,
          isVisible: false, // สำเนาเริ่มต้นเป็นซ่อนไว้ ผู้ดูแลตั้งค่าให้เสร็จก่อนค่อยเปิด
          config: source.config ?? {},
          createdById: req.user!.id,
          updatedById: req.user!.id,
        },
      });
      await writeAuditLog(
        req,
        { action: 'CREATE', entity: 'HomepageSection', entityId: row.id, after: row },
        tx,
      );
      return row;
    });

    sendSuccess(res, copy, 201);
  }),
);

/** ลบ section ที่เป็นสำเนา — ต้นฉบับชุดแรกของแต่ละชนิดลบไม่ได้ เพื่อไม่ให้หน้าเว็บขาดส่วนสำคัญ */
adminRouter.delete(
  '/sections/:id',
  requirePermission('homepage:update'),
  asyncHandler(async (req, res) => {
    const id = String(req.params.id);
    const section = await prisma.homepageSection.findUnique({ where: { id } });
    if (!section) throw ApiError.notFound('ไม่พบ section ที่ต้องการลบ');

    const count = await prisma.homepageSection.count({ where: { type: section.type } });
    if (count <= 1) {
      throw ApiError.conflict(
        `section ชนิด ${section.type} เหลือชุดเดียว ลบไม่ได้ — ถ้าไม่ต้องการแสดง ให้กดซ่อนแทน`,
      );
    }

    await prisma.$transaction(async (tx) => {
      await tx.homepageSection.delete({ where: { id } });
      await writeAuditLog(
        req,
        { action: 'DELETE', entity: 'HomepageSection', entityId: id, before: section },
        tx,
      );
    });

    sendSuccess(res, { id });
  }),
);

export { publicRouter as homepagePublicRouter, adminRouter as homepageAdminRouter };
