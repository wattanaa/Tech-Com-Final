import { z } from 'zod';
import { cuid, optionalText, stringArray, thaiText } from './common.js';

// ────────────────────────────  Homepage Builder  ────────────────────────────

const ctaSchema = z.object({
  label: thaiText('ข้อความบนปุ่ม', 1, 60),
  href: z.string().trim().min(1).max(300),
});

/**
 * ค่าตั้งของแต่ละ Section
 *
 * เก็บเป็น JSONB ในฐานข้อมูลเพื่อให้เพิ่มฟิลด์ใหม่ได้โดยไม่ต้อง migrate
 * แต่ยังตรวจความถูกต้องทุกครั้งด้วย discriminated union ตาม type
 * จึงได้ความยืดหยุ่นของ JSON พร้อมความปลอดภัยของ schema
 */
export const sectionConfigSchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('HERO'),
    badge: optionalText(120),
    heading: thaiText('หัวข้อหลัก', 5, 120),
    subheading: optionalText(200),
    primaryCta: ctaSchema.nullish(),
    secondaryCta: ctaSchema.nullish(),
    backgroundImageId: cuid.nullish(),
    showGrid: z.boolean().default(true),
    showGlow: z.boolean().default(true),
  }),
  z.object({ type: z.literal('STATISTICS'), animate: z.boolean().default(true) }),
  z.object({ type: z.literal('ABOUT'), layout: z.enum(['split', 'stacked']).default('split') }),
  z.object({ type: z.literal('PROGRAMS'), layout: z.enum(['grid', 'list']).default('grid') }),
  z.object({ type: z.literal('COURSES'), limit: z.number().int().min(1).max(24).default(6) }),
  z.object({ type: z.literal('TEACHERS'), limit: z.number().int().min(1).max(24).default(8) }),
  z.object({ type: z.literal('PROJECTS'), limit: z.number().int().min(1).max(24).default(6) }),
  z.object({ type: z.literal('ACTIVITIES'), limit: z.number().int().min(1).max(24).default(4) }),
  z.object({
    type: z.literal('NEWS'),
    limit: z.number().int().min(1).max(24).default(3),
    categoryId: cuid.nullish(),
    layout: z.enum(['grid', 'list']).default('grid'),
    showViewAll: z.boolean().default(true),
  }),
  z.object({ type: z.literal('GALLERY'), limit: z.number().int().min(1).max(48).default(8) }),
  z.object({
    type: z.literal('FACILITIES'),
    layout: z.enum(['grid', 'carousel']).default('carousel'),
  }),
  z.object({
    type: z.literal('CONTACT'),
    showMap: z.boolean().default(true),
    showForm: z.boolean().default(true),
  }),
]);

export const updateSectionSchema = z.object({
  title: optionalText(150),
  subtitle: optionalText(250),
  isVisible: z.boolean().optional(),
  config: sectionConfigSchema.optional(),
});

/** ลำดับใหม่ทั้งชุดหลังลากวาง — ส่งมาทีเดียวแล้วบันทึกในทรานแซกชันเดียว */
export const reorderSectionsSchema = z.object({
  items: z
    .array(z.object({ id: cuid, order: z.number().int().min(0).max(999) }))
    .min(1, 'ไม่มี section ให้จัดลำดับ')
    .max(50),
});

// ──────────────────────────────  เมนูนำทาง  ──────────────────────────────

const navShape = {
  label: thaiText('ชื่อเมนู', 1, 100),
  href: z.string().trim().min(1, 'กรุณากรอกลิงก์').max(300),
  icon: optionalText(50),
  order: z.number().int().min(0).max(999).default(0),
  isVisible: z.boolean().default(true),
  target: z.enum(['_self', '_blank']).default('_self'),
  location: z.enum(['HEADER', 'FOOTER']).default('HEADER'),
  parentId: cuid.nullish(),
};

export const createNavigationSchema = z.object(navShape);
export const updateNavigationSchema = z.object(navShape).partial();

// ────────────────────────────  ตั้งค่าเว็บไซต์  ────────────────────────────

/**
 * ค่าของ site_settings เป็น JSON ที่มีรูปร่างต่างกันไปตาม key
 * จึงตรวจตาม key ที่รู้จัก และปฏิเสธ key ที่ไม่รู้จักเพื่อไม่ให้มีขยะสะสมในตาราง
 */
export const settingSchemas = {
  general: z.object({
    siteName: thaiText('ชื่อเว็บไซต์', 1, 200),
    collegeName: thaiText('ชื่อวิทยาลัย', 1, 200),
    tagline: optionalText(300),
    logoId: cuid.nullish(),
  }),
  about: z.object({
    history: thaiText('ประวัติแผนก', 10, 10_000),
    vision: thaiText('วิสัยทัศน์', 5, 2_000),
    mission: z.array(z.string().trim().min(1).max(500)).max(15).default([]),
    strengths: z.array(z.string().trim().min(1).max(500)).max(15).default([]),
    goals: z.array(z.string().trim().min(1).max(500)).max(15).default([]),
  }),
  contact: z.object({
    address: thaiText('ที่อยู่', 5, 500),
    phone: z.string().trim().max(50).default(''),
    email: z.string().trim().max(200).default(''),
    mapEmbedUrl: z.string().trim().max(1_000).default(''),
    officeHours: z.string().trim().max(200).default(''),
  }),
  social: z.object({
    facebook: z.string().trim().max(300).default(''),
    youtube: z.string().trim().max(300).default(''),
    line: z.string().trim().max(300).default(''),
    tiktok: z.string().trim().max(300).default(''),
  }),
  footer: z.object({
    description: thaiText('คำอธิบายท้ายเว็บไซต์', 5, 1_000),
    copyright: thaiText('ข้อความลิขสิทธิ์', 1, 300),
    quickLinks: z
      .array(z.object({ label: thaiText('ชื่อลิงก์', 1, 100), href: z.string().trim().max(300) }))
      .max(12)
      .default([]),
  }),
} as const;

export type SettingKey = keyof typeof settingSchemas;

export const isSettingKey = (key: string): key is SettingKey => key in settingSchemas;

// ─────────────────────────────────  SEO  ─────────────────────────────────

export const upsertSeoSchema = z.object({
  path: z
    .string()
    .trim()
    .min(1, 'กรุณากรอกเส้นทางของหน้า')
    .max(200)
    .regex(/^\//, 'เส้นทางต้องขึ้นต้นด้วย /'),
  title: thaiText('ชื่อหน้า (title)', 5, 70),
  description: z
    .string()
    .trim()
    .max(160, 'คำอธิบายควรยาวไม่เกิน 160 ตัวอักษร เพื่อให้แสดงครบในผลการค้นหา')
    .nullish(),
  keywords: stringArray(15),
  ogImageId: cuid.nullish(),
  canonical: z.string().trim().max(300).nullish(),
});
