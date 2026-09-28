import { Router } from 'express';
import { authGuard } from '../middleware/auth.middleware.js';
import { requirePermission } from '../middleware/rbac.middleware.js';
import { importUploadMiddleware } from '../middleware/importUpload.middleware.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import {
  importTeachers,
  importStudents,
  downloadTeacherTemplate,
  downloadStudentTemplate,
} from '../controllers/import.controller.js';

/** นำเข้าข้อมูลครูและนักศึกษาจากไฟล์ Excel — เพิ่มข้อมูลใหม่เท่านั้น ไม่แก้ของเดิม */
const router = Router();
router.use(authGuard);

router.get('/teachers/template', requirePermission('teacher:create'), asyncHandler(downloadTeacherTemplate));
router.post('/teachers', requirePermission('teacher:create'), importUploadMiddleware, asyncHandler(importTeachers));

router.get('/students/template', requirePermission('student:create'), asyncHandler(downloadStudentTemplate));
router.post('/students', requirePermission('student:create'), importUploadMiddleware, asyncHandler(importStudents));

export default router;
