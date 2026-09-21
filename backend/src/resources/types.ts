import type { ListQuery } from '../utils/pagination.js';
import type { ZodSchema } from 'zod';
//import type { SortOrder } from '../utils/pagination.js';
//import type { ListQuery } from '../utils/pagination.js';

/**
 * นิยามของ 1 Entity — ใช้ประกอบเป็น service, controller และ route อัตโนมัติ
 *
 * ทุก entity ใช้ตรรกะ CRUD ชุดเดียวกัน (search · filter · sort · pagination ·
 * soft delete · audit log · version history · workflow) ต่างกันแค่ค่าในนี้
 * จึงไม่ต้องเขียนโค้ดซ้ำ 13 รอบ และแก้พฤติกรรมทีเดียวมีผลทั้งระบบ
 */
export interface ResourceConfig {
  /** ชื่อ model ตาม Prisma เช่น "news" — ต้องตรงกับ key ใน PrismaClient */
  model: string;
  /** ชื่อที่ใช้ใน audit log และ version history เช่น "News" */
  entity: string;
  /** ส่วนของ URL เช่น "news" → /api/v1/news */
  route: string;
  /** ชื่อภาษาไทยสำหรับข้อความแจ้งผู้ใช้ */
  label: string;
  /** กลุ่มสิทธิ์ เช่น "news" → ตรวจ news:create, news:update, ... */
  permission: string;

  /** ฟิลด์ที่ค้นหาด้วย ?search= */
  searchFields: readonly string[];
  /** ฟิลด์ที่เรียงลำดับได้ด้วย ?sort= */
  sortFields: readonly string[];
// เปลี่ยนจาก:
// defaultSort: SortOrder;
// เป็น:
  defaultSort: Record<string, 'asc' | 'desc'> | any;

  /** ข้อมูลที่ join มาด้วยตอนเรียกจากหน้าเว็บสาธารณะ */
  publicInclude?: Record<string, unknown>;
  /** ข้อมูลที่ join มาด้วยตอนเรียกจาก Admin */
  adminInclude?: Record<string, unknown>;

  /** มี status ตาม Content Workflow หรือไม่ */
  hasStatus: boolean;
  /** มี slug สำหรับ URL หรือไม่ */
  hasSlug: boolean;
  /** มี deletedAt (soft delete) หรือไม่ */
  softDelete: boolean;
  /** เก็บประวัติเวอร์ชันหรือไม่ */
  versioned: boolean;
  /** มีตัวนับยอดเข้าชมหรือไม่ */
  hasViews: boolean;
  /** ฟิลด์ที่ใช้ตั้ง slug ตอนสร้าง */
  slugFrom?: string;
  /** ฟิลด์ที่ใช้ค้นหารายการเดียวจาก URL — ค่าเริ่มต้นคือ slug ถ้ามี ไม่งั้นใช้ id */
  lookupField?: 'slug' | 'code' | 'id';

  createSchema: ZodSchema;
  updateSchema: ZodSchema;

  /**
   * แปลงข้อมูลจากฟอร์มให้เป็นรูปแบบที่ Prisma รับได้
   * ใช้กับความสัมพันธ์แบบหลายต่อหลาย เช่น teacherIds → teachers: { create: [...] }
   */
  transformInput?: (
    input: Record<string, unknown>,
    mode: 'create' | 'update',
  ) => Record<string, unknown>;

  /** เงื่อนไขเพิ่มเติมจาก query string เช่น filter ตามปีหรือช่วงวันที่ */
  extraFilters?: (query: ListQuery) => Record<string, unknown> | undefined;
  /** เงื่อนไขบังคับสำหรับ endpoint สาธารณะ เช่น เห็นเฉพาะที่ isVisible */
  publicWhere?: Record<string, unknown>;
}
