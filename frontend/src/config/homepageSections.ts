import { z } from 'zod';
import type { ResourceFormField } from '@/components/admin/resource/ResourceForm';
import type { SectionType } from '@/types';

export const SECTION_TYPE_LABEL: Record<SectionType, string> = {
  HERO: 'ส่วนหัว (Hero)',
  STATISTICS: 'สถิติแผนก',
  ABOUT: 'เกี่ยวกับแผนก',
  PROGRAMS: 'หลักสูตร',
  COURSES: 'รายวิชา',
  TEACHERS: 'ครูและบุคลากร',
  PROJECTS: 'ผลงานนักศึกษา',
  ACTIVITIES: 'กิจกรรม',
  NEWS: 'ข่าวประชาสัมพันธ์',
  GALLERY: 'คลังภาพ',
  FACILITIES: 'ห้องปฏิบัติการ',
  CONTACT: 'ติดต่อแผนก',
};

/**
 * ฟอร์มค่าตั้งของแต่ละ section ที่ "แบน" (flatten) จาก config จริงของ backend
 * เพื่อให้ใช้กับ ResourceForm ได้ — ตอนบันทึกต้องประกอบกลับเป็นรูปทรงเดิมด้วย
 * buildSectionConfig() ก่อนส่ง API เสมอ (โดยเฉพาะ primaryCta/secondaryCta ที่ backend เก็บเป็น object ซ้อน)
 */
const configFieldsByType: Record<SectionType, ResourceFormField[]> = {
  HERO: [
    { name: 'badge', label: 'ข้อความป้ายเล็กด้านบน', type: 'text', colSpan: 2 },
    { name: 'heading', label: 'หัวข้อหลัก', type: 'text', colSpan: 2 },
    { name: 'subheading', label: 'หัวข้อรอง', type: 'textarea', colSpan: 2, rows: 2 },
    { name: 'backgroundImageId', label: 'พื้นหลัง (รูปภาพหรือวิดีโอ)', type: 'media', colSpan: 2 },
    { name: 'primaryCtaLabel', label: 'ปุ่มหลัก — ข้อความ', type: 'text' },
    { name: 'primaryCtaHref', label: 'ปุ่มหลัก — ลิงก์', type: 'text' },
    { name: 'secondaryCtaLabel', label: 'ปุ่มรอง — ข้อความ', type: 'text' },
    { name: 'secondaryCtaHref', label: 'ปุ่มรอง — ลิงก์', type: 'text' },
    { name: 'showGrid', label: 'แสดงลายกริดพื้นหลัง', type: 'checkbox' },
    { name: 'showGlow', label: 'แสดงแสงเรืองพื้นหลัง', type: 'checkbox' },
    { name: 'showFloatingCards', label: 'แสดงการ์ดลอยตกแต่ง (2 ใบ)', type: 'checkbox' },
    { name: 'statCardTitle', label: 'การ์ดลอย 1 — หัวข้อ', type: 'text' },
    { name: 'statCardSubtitle', label: 'การ์ดลอย 1 — คำอธิบาย', type: 'text' },
    { name: 'awardCardTitle', label: 'การ์ดลอย 2 — หัวข้อ', type: 'text' },
    { name: 'awardCardNumber', label: 'การ์ดลอย 2 — ตัวเลข', type: 'text' },
    { name: 'awardCardSuffix', label: 'การ์ดลอย 2 — ส่วนต่อท้ายตัวเลข', type: 'text' },
  ],
  STATISTICS: [{ name: 'animate', label: 'เล่นแอนิเมชันตัวเลขนับ', type: 'checkbox' }],
  ABOUT: [
    {
      name: 'layout',
      label: 'รูปแบบการจัดวาง',
      type: 'select',
      options: [
        { value: 'split', label: 'แบ่งครึ่ง' },
        { value: 'stacked', label: 'เรียงซ้อน' },
      ],
    },
  ],
  PROGRAMS: [
    {
      name: 'layout',
      label: 'รูปแบบการจัดวาง',
      type: 'select',
      options: [
        { value: 'grid', label: 'ตาราง' },
        { value: 'list', label: 'รายการ' },
      ],
    },
  ],
  COURSES: [{ name: 'limit', label: 'จำนวนที่แสดง', type: 'number' }],
  TEACHERS: [{ name: 'limit', label: 'จำนวนที่แสดง', type: 'number' }],
  PROJECTS: [{ name: 'limit', label: 'จำนวนที่แสดง', type: 'number' }],
  ACTIVITIES: [{ name: 'limit', label: 'จำนวนที่แสดง', type: 'number' }],
  NEWS: [
    { name: 'limit', label: 'จำนวนที่แสดง', type: 'number' },
    { name: 'categoryId', label: 'กรองเฉพาะหมวดหมู่ (ถ้ามี)', type: 'select', options: [] },
    {
      name: 'layout',
      label: 'รูปแบบการจัดวาง',
      type: 'select',
      options: [
        { value: 'grid', label: 'ตาราง' },
        { value: 'list', label: 'รายการ' },
      ],
    },
    { name: 'showViewAll', label: 'แสดงปุ่ม "ดูทั้งหมด"', type: 'checkbox' },
  ],
  GALLERY: [{ name: 'limit', label: 'จำนวนที่แสดง', type: 'number' }],
  FACILITIES: [
    {
      name: 'layout',
      label: 'รูปแบบการจัดวาง',
      type: 'select',
      options: [
        { value: 'grid', label: 'ตาราง' },
        { value: 'carousel', label: 'เลื่อนภาพ' },
      ],
    },
  ],
  CONTACT: [
    { name: 'showMap', label: 'แสดงแผนที่', type: 'checkbox' },
    { name: 'showForm', label: 'แสดงฟอร์มติดต่อ', type: 'checkbox' },
  ],
};

const COMMON_FIELDS: ResourceFormField[] = [
  { name: 'title', label: 'หัวข้อ section', type: 'text' },
  { name: 'subtitle', label: 'หัวข้อรอง', type: 'text' },
  { name: 'isVisible', label: 'แสดง section นี้บนหน้าแรก', type: 'checkbox' },
];

export function getSectionFormFields(type: SectionType): ResourceFormField[] {
  return [...COMMON_FIELDS, ...configFieldsByType[type]];
}

const commonShape = {
  title: z.string().trim().max(150).optional().or(z.literal('')),
  subtitle: z.string().trim().max(250).optional().or(z.literal('')),
  isVisible: z.boolean(),
};

const configShapeByType: Record<SectionType, z.ZodRawShape> = {
  HERO: {
    badge: z.string().trim().max(120).optional().or(z.literal('')),
    heading: z.string().trim().min(5, 'กรุณากรอกหัวข้อหลัก').max(120),
    subheading: z.string().trim().max(200).optional().or(z.literal('')),
    backgroundImageId: z.string().optional().or(z.literal('')),
    primaryCtaLabel: z.string().trim().max(60).optional().or(z.literal('')),
    primaryCtaHref: z.string().trim().max(300).optional().or(z.literal('')),
    secondaryCtaLabel: z.string().trim().max(60).optional().or(z.literal('')),
    secondaryCtaHref: z.string().trim().max(300).optional().or(z.literal('')),
    showGrid: z.boolean(),
    showGlow: z.boolean(),
    showFloatingCards: z.boolean(),
    statCardTitle: z.string().trim().max(60).optional().or(z.literal('')),
    statCardSubtitle: z.string().trim().max(100).optional().or(z.literal('')),
    awardCardTitle: z.string().trim().max(60).optional().or(z.literal('')),
    awardCardNumber: z.string().trim().max(20).optional().or(z.literal('')),
    awardCardSuffix: z.string().trim().max(20).optional().or(z.literal('')),
  },
  STATISTICS: { animate: z.boolean() },
  ABOUT: { layout: z.enum(['split', 'stacked']) },
  PROGRAMS: { layout: z.enum(['grid', 'list']) },
  COURSES: { limit: z.coerce.number().int().min(1).max(24) },
  TEACHERS: { limit: z.coerce.number().int().min(1).max(24) },
  PROJECTS: { limit: z.coerce.number().int().min(1).max(24) },
  ACTIVITIES: { limit: z.coerce.number().int().min(1).max(24) },
  NEWS: {
    limit: z.coerce.number().int().min(1).max(24),
    categoryId: z.string().optional().or(z.literal('')),
    layout: z.enum(['grid', 'list']),
    showViewAll: z.boolean(),
  },
  GALLERY: { limit: z.coerce.number().int().min(1).max(48) },
  FACILITIES: { layout: z.enum(['grid', 'carousel']) },
  CONTACT: { showMap: z.boolean(), showForm: z.boolean() },
};

export function getSectionFormSchema(type: SectionType) {
  return z.object({ ...commonShape, ...configShapeByType[type] });
}

/** ค่าตั้งต้นของฟอร์ม (แบนแล้ว) จาก HomepageSection ที่โหลดมาจาก API */
export function sectionToFormDefaults(section: {
  title: string | null;
  subtitle: string | null;
  isVisible: boolean;
  config: Record<string, unknown>;
}): Record<string, unknown> {
  const c = section.config as Record<string, unknown>;
  const primaryCta = c.primaryCta as { label?: string; href?: string } | null | undefined;
  const secondaryCta = c.secondaryCta as { label?: string; href?: string } | null | undefined;
  return {
    title: section.title ?? '',
    subtitle: section.subtitle ?? '',
    isVisible: section.isVisible,
    ...c,
    backgroundImageId: c.backgroundImageId ?? '',
    categoryId: c.categoryId ?? '',
    primaryCtaLabel: primaryCta?.label ?? '',
    primaryCtaHref: primaryCta?.href ?? '',
    secondaryCtaLabel: secondaryCta?.label ?? '',
    secondaryCtaHref: secondaryCta?.href ?? '',
    // undefined ต้องตีความว่า "แสดง" (ค่าเริ่มต้นเดิมของโค้ดก่อนมีสวิตช์นี้) ไม่งั้น checkbox
    // จะขึ้นไม่ติ๊กทั้งที่การ์ดยังโชว์อยู่จริงบนหน้าเว็บ ทำให้แอดมินสับสน
    showFloatingCards: c.showFloatingCards ?? true,
    statCardTitle: c.statCardTitle ?? '',
    statCardSubtitle: c.statCardSubtitle ?? '',
    awardCardTitle: c.awardCardTitle ?? '',
    awardCardNumber: c.awardCardNumber ?? '',
    awardCardSuffix: c.awardCardSuffix ?? '',
  };
}

/** ประกอบค่าฟอร์มที่แบนแล้วกลับเป็น { title, subtitle, isVisible, config } ตามรูปที่ backend ต้องการ */
export function buildSectionUpdatePayload(
  type: SectionType,
  values: Record<string, unknown>,
): { title: string | null; subtitle: string | null; isVisible: boolean; config: Record<string, unknown> } {
  const { title, subtitle, isVisible, ...rest } = values;

  let config: Record<string, unknown> = { type, ...rest };
  if (type === 'HERO') {
    const { primaryCtaLabel, primaryCtaHref, secondaryCtaLabel, secondaryCtaHref, ...others } = rest;
    config = {
      type,
      ...others,
      primaryCta: primaryCtaLabel ? { label: primaryCtaLabel, href: primaryCtaHref || '#' } : null,
      secondaryCta: secondaryCtaLabel ? { label: secondaryCtaLabel, href: secondaryCtaHref || '#' } : null,
      backgroundImageId: (rest.backgroundImageId as string) || undefined,
    };
  }

  return {
    title: (title as string) || null,
    subtitle: (subtitle as string) || null,
    isVisible: Boolean(isVisible),
    config,
  };
}
