import { Router } from 'express';
import healthRoutes from './health.routes.js';
import authRoutes from './auth.routes.js';
import searchRoutes from './search.routes.js';
import dashboardRoutes from './dashboard.routes.js';
import notificationRoutes from './notifications.routes.js';
import usersRoutes from './users.routes.js';
import auditRoutes from './audit.routes.js';
import backupRoutes from './backup.routes.js';
import mediaRoutes from './media.routes.js';
import importRoutes from './import.routes.js';
import { allResources } from '../resources/index.js';
import { buildResourceRouters } from './resource.routes.js';
import { contactPublicRouter, contactAdminRouter } from './contact.routes.js';
import { homepagePublicRouter, homepageAdminRouter } from './homepage.routes.js';
import { navigationPublicRouter, navigationAdminRouter } from './navigation.routes.js';
import { settingsPublicRouter, settingsAdminRouter } from './settings.routes.js';
import { galleryPublicRouter, galleryAdminRouter } from './gallery.routes.js';

/**
 * Router กลาง — ประกอบทุกเส้นทางเข้าด้วยกัน
 *
 * โครงสร้าง URL:
 *   /api/v1/<entity>          อ่านอย่างเดียว ไม่ต้องล็อกอิน (หน้าเว็บสาธารณะ)
 *   /api/v1/admin/<entity>    จัดการข้อมูล ต้องล็อกอินและมีสิทธิ์ตรงตามการกระทำ
 */
const router = Router();
const adminRouter = Router();

// ── สาธารณะ · ระบบ ──────────────────────────────────────────
router.use('/health', healthRoutes);
router.use('/auth', authRoutes);
router.use('/search', searchRoutes);
router.use('/contact', contactPublicRouter);
router.use('/homepage', homepagePublicRouter);
router.use('/navigation', navigationPublicRouter);
router.use('/settings', settingsPublicRouter);
router.use('/gallery', galleryPublicRouter);

// ── สาธารณะ · เนื้อหา (สร้างจากนิยาม entity ชุดเดียวกัน) ─────
for (const config of allResources) {
  const { publicRouter, adminRouter: entityAdmin } = buildResourceRouters(config);
  router.use(`/${config.route}`, publicRouter);
  adminRouter.use(`/${config.route}`, entityAdmin);
}

// ── หลังบ้าน ────────────────────────────────────────────────
adminRouter.use('/dashboard', dashboardRoutes);
adminRouter.use('/notifications', notificationRoutes);
adminRouter.use('/messages', contactAdminRouter);
adminRouter.use('/homepage', homepageAdminRouter);
adminRouter.use('/navigation', navigationAdminRouter);
adminRouter.use('/settings', settingsAdminRouter);
adminRouter.use('/media', mediaRoutes);
adminRouter.use('/import', importRoutes);
adminRouter.use('/gallery', galleryAdminRouter);
adminRouter.use('/users', usersRoutes);
adminRouter.use('/audit-logs', auditRoutes);
adminRouter.use('/backups', backupRoutes);

router.use('/admin', adminRouter);

router.get('/', (_req, res) => {
  res.json({
    success: true,
    data: {
      name: 'TCOM API',
      description: 'ระบบเว็บไซต์สารสนเทศ แผนกวิชาเทคโนโลยีคอมพิวเตอร์ วิทยาลัยเทคนิคร้อยเอ็ด',
      version: 'v1',
      resources: allResources.map((r) => r.route),
    },
  });
});

export default router;
