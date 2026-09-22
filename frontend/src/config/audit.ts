import type { AuditAction } from '@/api/admin/audit';

/** ป้ายภาษาไทยของการกระทำในบันทึกการใช้งาน — ใช้ร่วมกันระหว่างแดชบอร์ดและหน้าบันทึกการใช้งาน */
export const ACTION_LABEL: Record<AuditAction, string> = {
  CREATE: 'สร้าง',
  UPDATE: 'แก้ไข',
  DELETE: 'ลบ',
  LOGIN: 'เข้าสู่ระบบ',
  LOGOUT: 'ออกจากระบบ',
  PUBLISH: 'เผยแพร่',
  UNPUBLISH: 'ยกเลิกเผยแพร่',
  RESTORE: 'กู้คืน',
};

export const ACTION_COLOR: Record<AuditAction, string> = {
  CREATE: '#16a34a',
  UPDATE: '#0ea5e9',
  DELETE: '#DC2626',
  LOGIN: '#64748b',
  LOGOUT: '#64748b',
  PUBLISH: '#16a34a',
  UNPUBLISH: '#f59e0b',
  RESTORE: '#8b5cf6',
};

/** ป้ายภาษาไทยของชื่อ entity ที่ backend บันทึกไว้ตรงตัว (ชื่อ Prisma model) — ตัวไหนไม่พบใช้ค่าดิบแทน */
export const ENTITY_LABEL: Record<string, string> = {
  User: 'ผู้ใช้งาน',
  News: 'ข่าวประชาสัมพันธ์',
  Activity: 'กิจกรรม',
  Project: 'ผลงานนักศึกษา',
  Teacher: 'ครูและบุคลากร',
  Student: 'นักศึกษา',
  Program: 'หลักสูตร',
  Course: 'รายวิชา',
  Facility: 'ห้องปฏิบัติการ',
  Album: 'อัลบั้มภาพ',
  Category: 'หมวดหมู่',
  Media: 'คลังสื่อ',
  Backup: 'สำรองข้อมูล',
  ContactMessage: 'ข้อความติดต่อ',
  NavigationItem: 'เมนูนำทาง',
  SiteSetting: 'ตั้งค่าเว็บไซต์',
  SeoSetting: 'ตั้งค่า SEO',
  HomepageSection: 'ส่วนหน้าแรก',
};

export function entityLabel(entity: string): string {
  return ENTITY_LABEL[entity] ?? entity;
}
