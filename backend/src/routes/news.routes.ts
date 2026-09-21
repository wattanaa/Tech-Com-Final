import { Router } from 'express';
import { getNewsList } from '../controllers/news.controller.js';
import { requireAuth, requireRole } from '../middleware/auth.middleware.js';

const router = Router();

router.get('/', getNewsList);
// ถ้าใน news.controller.ts ยังไม่มีฟังก์ชัน createNews หรือ deleteNews 
// ให้คอมเมนต์ 2 บรรทัดนี้ไว้ก่อน หรือใส่ placeholder ไว้:
router.post('/', requireAuth, requireRole(['SUPER_ADMIN', 'ADMIN', 'EDITOR']), (_req, res) => { res.json({ message: 'create' }); });
router.delete('/:id', requireAuth, requireRole(['SUPER_ADMIN', 'ADMIN']), (_req, res) => { res.json({ message: 'delete' }); });

export default router;