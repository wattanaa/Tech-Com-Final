import type { Request } from 'express';
import ExcelJS from 'exceljs';
import { Prisma, CategoryType } from '@prisma/client';
import type { ZodError } from 'zod';
import { prisma } from '../config/database.js';
import { ApiError } from '../utils/ApiError.js';
import { uniqueSlug } from '../utils/slug.js';
import { writeAuditLog } from './audit.service.js';
import { createTeacherSchema, createStudentSchema } from '../validators/academic.validators.js';

export interface ImportRowIssue {
  row: number;
  message: string;
}

export interface ImportResult {
  total: number;
  created: number;
  errors: ImportRowIssue[];
  warnings: ImportRowIssue[];
}

// ─────────────────────────────  อ่านไฟล์ Excel  ─────────────────────────────

function cellToText(value: ExcelJS.CellValue): string {
  if (value === null || value === undefined) return '';
  if (value instanceof Date) return value.toLocaleDateString('th-TH');
  if (typeof value === 'object') {
    const v = value as { text?: unknown; result?: unknown; richText?: { text: string }[] };
    if (Array.isArray(v.richText)) return v.richText.map((t) => t.text).join('').trim();
    if ('result' in v) return String(v.result ?? '').trim();
    if ('text' in v) return String(v.text ?? '').trim();
    return '';
  }
  return String(value).trim();
}

async function readSheetRows(buffer: Buffer): Promise<{ headers: string[]; rows: string[][] }> {
  const workbook = new ExcelJS.Workbook();
  try {
    // exceljs ประกาศ global Buffer ทับของ Node เอง (เพื่อรองรับ browser bundle) ทำให้ตัว
    // interface Buffer ที่ merge แล้วขัดแย้งในตัวเอง (slice() คืนคนละชนิด) จน TS เทียบชนิดไม่ผ่าน
    // ทั้งที่ runtime เป็น Buffer ปกติของ Node — ตัด type-check ตรงจุดนี้จุดเดียวเพื่อเลี่ยงบั๊กของ .d.ts บุคคลที่สาม
    await workbook.xlsx.load(buffer as any); // eslint-disable-line @typescript-eslint/no-explicit-any
  } catch {
    throw ApiError.badRequest('อ่านไฟล์ Excel ไม่สำเร็จ กรุณาตรวจสอบว่าเป็นไฟล์ .xlsx ที่ถูกต้อง');
  }
  const sheet = workbook.worksheets[0];
  if (!sheet || sheet.rowCount < 1) throw ApiError.badRequest('ไม่พบข้อมูลในไฟล์ Excel');

  const headerRow = sheet.getRow(1);
  const headers: string[] = [];
  for (let i = 1; i <= headerRow.cellCount; i++) headers.push(cellToText(headerRow.getCell(i).value));

  const rows: string[][] = [];
  sheet.eachRow((row, rowNumber) => {
    if (rowNumber === 1) return;
    const cells: string[] = [];
    for (let i = 1; i <= headers.length; i++) cells.push(cellToText(row.getCell(i).value));
    if (cells.every((c) => c === '')) return; // ข้ามแถวว่าง
    rows.push(cells);
  });

  return { headers, rows };
}

function indexHeaders<K extends string>(
  headers: string[],
  map: Record<K, string>,
  required: readonly K[],
  entityLabel: string,
): Record<K, number> {
  const result = {} as Record<K, number>;
  const missing: string[] = [];
  for (const key of Object.keys(map) as K[]) {
    const idx = headers.indexOf(map[key]);
    result[key] = idx;
    if (idx === -1 && required.includes(key)) missing.push(map[key]);
  }
  if (missing.length > 0) {
    throw ApiError.badRequest(
      `ไฟล์ไม่มีคอลัมน์ที่จำเป็นสำหรับข้อมูล${entityLabel}: ${missing.join(', ')} — ดาวน์โหลดไฟล์ตัวอย่างแล้วกรอกตามหัวคอลัมน์เดิม`,
    );
  }
  return result;
}

function pluck<K extends string>(cells: string[], colIndex: Record<K, number>): Record<K, string> {
  const out = {} as Record<K, string>;
  for (const key of Object.keys(colIndex) as K[]) {
    const idx = colIndex[key];
    out[key] = (idx === -1 ? undefined : cells[idx]) ?? '';
  }
  return out;
}

function firstZodMessage(error: ZodError): string {
  return error.issues.map((issue) => issue.message).join(' / ') || 'ข้อมูลไม่ถูกต้อง';
}

function dbErrorMessage(err: unknown): string {
  if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
    return 'ข้อมูลซ้ำกับที่มีอยู่แล้วในระบบ (เช่น รหัสนักศึกษาซ้ำ)';
  }
  return 'บันทึกแถวนี้ไม่สำเร็จ';
}

const normalizeName = (s: string) => s.trim().toLowerCase();

// ─────────────────────────────  นำเข้าครูและบุคลากร  ─────────────────────────────

const TEACHER_HEADERS = {
  prefix: 'คำนำหน้าชื่อ',
  firstName: 'ชื่อ',
  lastName: 'นามสกุล',
  position: 'ตำแหน่ง',
  academicRank: 'วิทยฐานะ',
  type: 'ประเภท',
  email: 'อีเมล',
  phone: 'เบอร์โทร',
  facebook: 'Facebook',
  line: 'Line ID',
  specialties: 'ความเชี่ยวชาญ (คั่นด้วย ,)',
  order: 'ลำดับการแสดงผล',
} as const;

const TEACHER_REQUIRED = ['prefix', 'firstName', 'lastName', 'position'] as const;

export async function importTeachersFromExcel(req: Request, buffer: Buffer): Promise<ImportResult> {
  const { headers, rows } = await readSheetRows(buffer);
  const colIndex = indexHeaders<keyof typeof TEACHER_HEADERS>(headers, TEACHER_HEADERS, TEACHER_REQUIRED, 'ครูและบุคลากร');

  const existingTypes = await prisma.category.findMany({ where: { type: CategoryType.TEACHER } });
  const typeByName = new Map(existingTypes.map((c) => [normalizeName(c.name), c]));
  let nextTypeOrder = existingTypes.reduce((max, c) => Math.max(max, c.order), 0) + 1;

  const errors: ImportRowIssue[] = [];
  const warnings: ImportRowIssue[] = [];
  let created = 0;

  for (const [i, cells] of rows.entries()) {
    const rowNumber = i + 2;
    const raw = pluck(cells, colIndex);
    try {
      let typeId: string | null = null;
      const typeName = raw.type.trim();
      if (typeName) {
        const key = normalizeName(typeName);
        let category = typeByName.get(key);
        if (!category) {
          const slug = await uniqueSlug('teacher-type', async (candidate) => {
            const found = await prisma.category.findFirst({ where: { slug: candidate, type: CategoryType.TEACHER } });
            return found !== null;
          });
          category = await prisma.category.create({
            data: { name: typeName, slug, type: CategoryType.TEACHER, order: nextTypeOrder++ },
          });
          typeByName.set(key, category);
        }
        typeId = category.id;
      }

      const specialties = raw.specialties
        ? raw.specialties.split(/[,\n、]/).map((s) => s.trim()).filter(Boolean).slice(0, 10)
        : [];

      const parsed = createTeacherSchema.safeParse({
        prefix: raw.prefix,
        firstName: raw.firstName,
        lastName: raw.lastName,
        position: raw.position,
        academicRank: raw.academicRank || null,
        typeId,
        specialties,
        email: raw.email || '',
        phone: raw.phone || null,
        facebook: raw.facebook || '',
        line: raw.line || null,
        order: raw.order ? Number(raw.order) : 0,
      });

      if (!parsed.success) {
        errors.push({ row: rowNumber, message: firstZodMessage(parsed.error) });
        continue;
      }

      const row = await prisma.teacher.create({
        data: { ...parsed.data, createdById: req.user!.id, updatedById: req.user!.id },
      });
      await writeAuditLog(req, { action: 'CREATE', entity: 'Teacher', entityId: row.id, after: row });
      created += 1;
    } catch (err) {
      errors.push({ row: rowNumber, message: dbErrorMessage(err) });
    }
  }

  return { total: rows.length, created, errors, warnings };
}

export async function buildTeacherImportTemplate(): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet('ครูและบุคลากร');
  const headerValues = Object.values(TEACHER_HEADERS);
  sheet.addRow(headerValues);
  sheet.getRow(1).font = { bold: true };
  sheet.addRow([
    'นาย', 'สมชาย', 'ใจดี', 'ครูผู้สอน', 'ครูชำนาญการ', 'ครูผู้สอน',
    'somchai@example.ac.th', '043-000-000', 'https://facebook.com/somchai', 'somchai.line',
    'ระบบเครือข่ายคอมพิวเตอร์, ฐานข้อมูล', '1',
  ]);
  sheet.columns.forEach((col) => { col.width = 22; });

  const types = await prisma.category.findMany({
    where: { type: CategoryType.TEACHER },
    orderBy: { order: 'asc' },
    select: { name: true },
  });
  const refSheet = workbook.addWorksheet('รายการประเภทที่มีอยู่');
  refSheet.addRow(['พิมพ์ในคอลัมน์ "ประเภท" ให้ตรงกับชื่อในรายการนี้ หรือพิมพ์ชื่อใหม่เพื่อให้ระบบสร้างประเภทใหม่ให้อัตโนมัติ']);
  refSheet.getRow(1).font = { bold: true };
  refSheet.getColumn(1).width = 70;
  for (const t of types) refSheet.addRow([t.name]);

  return (await workbook.xlsx.writeBuffer()) as unknown as Buffer;
}

// ─────────────────────────────  นำเข้านักศึกษา  ─────────────────────────────

const STUDENT_HEADERS = {
  studentCode: 'รหัสนักศึกษา',
  prefix: 'คำนำหน้าชื่อ',
  firstName: 'ชื่อ',
  lastName: 'นามสกุล',
  level: 'ระดับชั้น',
  classRoom: 'ห้อง',
  year: 'ปีการศึกษา (พ.ศ.)',
  program: 'รหัสหลักสูตร',
} as const;

const STUDENT_REQUIRED = ['studentCode', 'prefix', 'firstName', 'lastName', 'level', 'year'] as const;

export async function importStudentsFromExcel(req: Request, buffer: Buffer): Promise<ImportResult> {
  const { headers, rows } = await readSheetRows(buffer);
  const colIndex = indexHeaders<keyof typeof STUDENT_HEADERS>(headers, STUDENT_HEADERS, STUDENT_REQUIRED, 'นักศึกษา');

  const programs = await prisma.program.findMany({ select: { id: true, code: true } });
  const programByCode = new Map(programs.map((p) => [p.code.trim().toLowerCase(), p.id]));

  const errors: ImportRowIssue[] = [];
  const warnings: ImportRowIssue[] = [];
  let created = 0;

  for (const [i, cells] of rows.entries()) {
    const rowNumber = i + 2;
    const raw = pluck(cells, colIndex);
    try {
      const programCode = raw.program.trim();
      const programId = programCode ? (programByCode.get(programCode.toLowerCase()) ?? null) : null;
      if (programCode && !programId) {
        warnings.push({ row: rowNumber, message: `ไม่พบหลักสูตรรหัส "${programCode}" — บันทึกข้อมูลโดยไม่ระบุหลักสูตร` });
      }

      const parsed = createStudentSchema.safeParse({
        studentCode: raw.studentCode,
        prefix: raw.prefix,
        firstName: raw.firstName,
        lastName: raw.lastName,
        level: raw.level,
        classRoom: raw.classRoom || null,
        year: raw.year ? Number(raw.year) : undefined,
        programId: programId ?? undefined,
      });

      if (!parsed.success) {
        errors.push({ row: rowNumber, message: firstZodMessage(parsed.error) });
        continue;
      }

      const row = await prisma.student.create({
        data: { ...parsed.data, createdById: req.user!.id, updatedById: req.user!.id },
      });
      await writeAuditLog(req, { action: 'CREATE', entity: 'Student', entityId: row.id, after: row });
      created += 1;
    } catch (err) {
      errors.push({ row: rowNumber, message: dbErrorMessage(err) });
    }
  }

  return { total: rows.length, created, errors, warnings };
}

export async function buildStudentImportTemplate(): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet('นักศึกษา');
  const headerValues = Object.values(STUDENT_HEADERS);
  sheet.addRow(headerValues);
  sheet.getRow(1).font = { bold: true };
  sheet.addRow(['30000000001', 'นาย', 'สมหมาย', 'ใจงาม', 'ปวช.3', '3/1', '2567', '20127']);
  sheet.columns.forEach((col) => { col.width = 22; });

  const programs = await prisma.program.findMany({ orderBy: { order: 'asc' }, select: { code: true, name: true } });
  const refSheet = workbook.addWorksheet('รายการหลักสูตรที่มีอยู่');
  refSheet.addRow(['รหัสหลักสูตร', 'ชื่อหลักสูตร']);
  refSheet.getRow(1).font = { bold: true };
  refSheet.getColumn(1).width = 18;
  refSheet.getColumn(2).width = 60;
  for (const p of programs) refSheet.addRow([p.code, p.name]);

  return (await workbook.xlsx.writeBuffer()) as unknown as Buffer;
}
