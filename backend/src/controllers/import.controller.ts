import type { Request, Response } from 'express';
import { ApiError } from '../utils/ApiError.js';
import { sendSuccess } from '../utils/ApiResponse.js';
import {
  importTeachersFromExcel,
  importStudentsFromExcel,
  buildTeacherImportTemplate,
  buildStudentImportTemplate,
} from '../services/import.service.js';

function requireFile(req: Request): Buffer {
  if (!req.file) throw ApiError.badRequest('กรุณาเลือกไฟล์ Excel ที่ต้องการนำเข้า');
  return req.file.buffer;
}

async function sendXlsx(res: Response, buffer: Buffer, filename: string): Promise<void> {
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  res.send(buffer);
}

export async function importTeachers(req: Request, res: Response): Promise<void> {
  sendSuccess(res, await importTeachersFromExcel(req, requireFile(req)));
}

export async function importStudents(req: Request, res: Response): Promise<void> {
  sendSuccess(res, await importStudentsFromExcel(req, requireFile(req)));
}

export async function downloadTeacherTemplate(_req: Request, res: Response): Promise<void> {
  await sendXlsx(res, await buildTeacherImportTemplate(), 'teacher-import-template.xlsx');
}

export async function downloadStudentTemplate(_req: Request, res: Response): Promise<void> {
  await sendXlsx(res, await buildStudentImportTemplate(), 'student-import-template.xlsx');
}
