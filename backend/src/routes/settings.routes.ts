import { Router } from 'express';
import type { Prisma } from '@prisma/client';
import { prisma } from '../config/database.js';
import { authGuard } from '../middleware/auth.middleware.js';
import { requirePermission } from '../middleware/rbac.middleware.js';
import { validate } from '../middleware/validate.middleware.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { sendSuccess } from '../utils/ApiResponse.js';
import { ApiError } from '../utils/ApiError.js';
import { isSettingKey, settingSchemas, upsertSeoSchema } from '../validators/cms.validators.js';
import { writeAuditLog } from '../services/audit.service.js';

const publicRouter = Router();
const adminRouter = Router();

/**
 * ค่า general.logoId เก็บแค่ id เพราะ site_settings.value เป็น JSON ธรรมดา ไม่ใช่ FK
 * จริง ๆ — แนบข้อมูลรูปเต็ม (url/thumbnailUrl) ให้ตอนอ่านออกเท่านั้น ไม่บันทึกกลับ
 */
async function withResolvedLogo(value: unknown): Promise<unknown> {
  if (!value || typeof value !== 'object') return value;
  const general = value as Record<string, unknown>;
  const logoId = general.logoId;
  if (typeof logoId !== 'string') return value;

  const media = await prisma.media.findUnique({
    where: { id: logoId },
    select: { id: true, url: true, thumbnailUrl: true, alt: true },
  });
  return { ...general, logo: media ?? null };
}

/**
 * GET /api/v1/settings
 * คืนค่าตั้งทั้งหมดในรูป { general: {...}, contact: {...}, ... }
 * หน้าเว็บเรียกครั้งเดียวตอนโหลดแล้วใช้ได้ทั้งเว็บไซต์
 */
publicRouter.get(
  '/',
  asyncHandler(async (_req, res) => {
    const rows = await prisma.siteSetting.findMany();
    const result: Record<string, unknown> = {};
    for (const row of rows) result[row.key] = row.value;
    if (result.general) result.general = await withResolvedLogo(result.general);
    sendSuccess(res, result);
  }),
);

/** GET /api/v1/seo?path=/news — ข้อมูล meta ของหน้าที่ขอ */
publicRouter.get(
  '/seo',
  asyncHandler(async (req, res) => {
    const path = String(req.query.path ?? '/');
    const seo = await prisma.seoSetting.findUnique({ where: { path } });
    // ไม่มีค่าเฉพาะหน้า ให้ใช้ค่าของหน้าแรกเป็นค่าตั้งต้น
    const fallback = seo ? null : await prisma.seoSetting.findUnique({ where: { path: '/' } });
    sendSuccess(res, seo ?? fallback ?? null);
  }),
);

// ── หลังบ้าน ────────────────────────────────────────────────
adminRouter.use(authGuard);

adminRouter.get(
  '/',
  requirePermission('homepage:read'),
  asyncHandler(async (_req, res) => {
    const rows = await prisma.siteSetting.findMany({ orderBy: { key: 'asc' } });
    const resolved = await Promise.all(
      rows.map(async (row) => (row.key === 'general' ? { ...row, value: await withResolvedLogo(row.value) } : row)),
    );
    sendSuccess(res, resolved);
  }),
);

/**
 * PUT /api/v1/admin/settings/:key
 * ตรวจค่าตาม schema ของ key นั้นโดยเฉพาะ และปฏิเสธ key ที่ไม่รู้จัก
 * เพื่อไม่ให้มีค่าขยะสะสมในตารางจนไม่มีใครกล้าลบ
 */
adminRouter.put(
  '/:key',
  requirePermission('settings:update'),
  asyncHandler(async (req, res) => {
    const key = String(req.params.key);
    if (!isSettingKey(key)) {
      throw ApiError.badRequest(
        `ไม่รู้จักการตั้งค่า "${key}" — ที่รองรับคือ ${Object.keys(settingSchemas).join(', ')}`,
      );
    }

    const parsed = settingSchemas[key].safeParse(req.body);
    if (!parsed.success) {
      const fields: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        fields[issue.path.join('.') || '_'] = issue.message;
      }
      throw ApiError.validation(fields);
    }

    const before = await prisma.siteSetting.findUnique({ where: { key } });
    const value = parsed.data as Prisma.InputJsonValue;

    const updated = await prisma.siteSetting.upsert({
      where: { key },
      update: { value, updatedById: req.user!.id },
      create: { key, group: key, value, updatedById: req.user!.id },
    });

    await writeAuditLog(req, {
      action: 'UPDATE',
      entity: 'SiteSetting',
      entityId: key,
      before: before?.value,
      after: updated.value,
    });

    sendSuccess(res, updated);
  }),
);

// ── SEO ─────────────────────────────────────────────────────

adminRouter.get(
  '/seo/all',
  requirePermission('homepage:read'),
  asyncHandler(async (_req, res) => {
    sendSuccess(res, await prisma.seoSetting.findMany({ orderBy: { path: 'asc' } }));
  }),
);

adminRouter.put(
  '/seo/upsert',
  requirePermission('seo:update'),
  validate(upsertSeoSchema),
  asyncHandler(async (req, res) => {
    const body = req.body as {
      path: string;
      title: string;
      description?: string | null;
      keywords: string[];
      ogImageId?: string | null;
      canonical?: string | null;
    };

    const before = await prisma.seoSetting.findUnique({ where: { path: body.path } });
    const saved = await prisma.seoSetting.upsert({
      where: { path: body.path },
      update: {
        title: body.title,
        description: body.description ?? null,
        keywords: body.keywords,
        ogImageId: body.ogImageId ?? null,
        canonical: body.canonical ?? null,
      },
      create: {
        path: body.path,
        title: body.title,
        description: body.description ?? null,
        keywords: body.keywords,
        ogImageId: body.ogImageId ?? null,
        canonical: body.canonical ?? null,
      },
    });

    await writeAuditLog(req, {
      action: before ? 'UPDATE' : 'CREATE',
      entity: 'SeoSetting',
      entityId: saved.id,
      before,
      after: saved,
    });

    sendSuccess(res, saved);
  }),
);

export { publicRouter as settingsPublicRouter, adminRouter as settingsAdminRouter };
