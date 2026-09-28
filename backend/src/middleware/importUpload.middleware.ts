import multer from 'multer';
import type { NextFunction, Request, Response } from 'express';
import { ApiError } from '../utils/ApiError.js';

/** ไฟล์ Excel ที่รองรับนำเข้า */
const ALLOWED_IMPORT_MIME = new Set([
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
  'application/vnd.ms-excel', // .xls (บางเบราว์เซอร์ส่ง mimetype นี้ให้ .xlsx ด้วย)
]);

const MAX_IMPORT_SIZE_BYTES = 5 * 1024 * 1024;

/** เก็บไฟล์นำเข้าไว้ในหน่วยความจำเท่านั้น ไม่เขียนลงดิสก์ — อ่านแล้วทิ้ง ไม่ใช่ไฟล์ถาวร */
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_IMPORT_SIZE_BYTES, files: 1 },
  fileFilter: (_req, file, cb) => {
    if (!ALLOWED_IMPORT_MIME.has(file.mimetype)) {
      cb(ApiError.badRequest('รองรับเฉพาะไฟล์ Excel (.xlsx) เท่านั้น'));
      return;
    }
    cb(null, true);
  },
}).single('file');

/**
 * middleware รับไฟล์ Excel ที่อัปโหลดมา — ครอบ multer ไว้เพื่อแปลง error
 * (เช่นไฟล์ใหญ่เกิน) ให้เป็น ApiError ที่มีข้อความภาษาไทยอ่านรู้เรื่อง
 * แทนที่จะหลุดไปเป็น 500 ทั่วไปที่ error handler กลางไม่รู้จัก
 */
export function importUploadMiddleware(req: Request, res: Response, next: NextFunction): void {
  upload(req, res, (err: unknown) => {
    if (!err) {
      next();
      return;
    }
    if (err instanceof ApiError) {
      next(err);
      return;
    }
    if (err instanceof multer.MulterError && err.code === 'LIMIT_FILE_SIZE') {
      next(ApiError.payloadTooLarge('ไฟล์ใหญ่เกิน 5 MB กรุณาแบ่งไฟล์ให้เล็กลง'));
      return;
    }
    next(ApiError.badRequest('อัปโหลดไฟล์ไม่สำเร็จ กรุณาลองใหม่อีกครั้ง'));
  });
}
