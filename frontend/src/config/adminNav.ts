import type { LucideIcon } from 'lucide-react';
import {
  BookOpen,
  CalendarDays,
  DatabaseBackup,
  FlaskConical,
  FolderOpen,
  GraduationCap,
  History,
  Images,
  LayoutDashboard,
  LayoutTemplate,
  Mail,
  Menu as MenuIcon,
  Newspaper,
  Settings,
  ShieldCheck,
  Tags,
  Trophy,
  Users,
} from 'lucide-react';

export interface AdminNavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  /** ไม่ระบุ = แสดงให้ผู้ login ทุกคนเห็น (ใช้กับหน้าที่ authGuard อย่างเดียวพอ เช่น dashboard) */
  permission?: string;
  superAdminOnly?: boolean;
}

export interface AdminNavGroup {
  label: string;
  items: AdminNavItem[];
}

/**
 * เมนูฝั่งหลังบ้าน — เพิ่มรายการใหม่ที่นี่ทุกครั้งที่มีหน้าใหม่เกิดขึ้นในแต่ละเฟส
 * Sidebar จะกรองให้เองตาม permission ของผู้ใช้แต่ละคน
 */
export const ADMIN_NAV: AdminNavGroup[] = [
  {
    label: 'ภาพรวม',
    items: [{ label: 'แดชบอร์ด', href: '/admin', icon: LayoutDashboard }],
  },
  {
    label: 'ข้อมูลวิชาการ',
    items: [
      { label: 'หลักสูตร', href: '/admin/programs', icon: BookOpen, permission: 'program:read' },
      { label: 'รายวิชา', href: '/admin/courses', icon: BookOpen, permission: 'course:read' },
      { label: 'ครูและบุคลากร', href: '/admin/teachers', icon: GraduationCap, permission: 'teacher:read' },
      { label: 'นักศึกษา', href: '/admin/students', icon: Users, permission: 'student:read' },
    ],
  },
  {
    label: 'เนื้อหาเว็บไซต์',
    items: [
      { label: 'ข่าวประชาสัมพันธ์', href: '/admin/news', icon: Newspaper, permission: 'news:read' },
      { label: 'กิจกรรม', href: '/admin/activities', icon: CalendarDays, permission: 'activity:read' },
      { label: 'ผลงานนักศึกษา', href: '/admin/projects', icon: Trophy, permission: 'project:read' },
      { label: 'ห้องปฏิบัติการ', href: '/admin/facilities', icon: FlaskConical, permission: 'facility:read' },
      { label: 'อัลบั้มภาพ', href: '/admin/albums', icon: Images, permission: 'gallery:read' },
      { label: 'หมวดหมู่', href: '/admin/categories', icon: Tags, permission: 'news:read' },
      { label: 'คลังสื่อ', href: '/admin/media', icon: FolderOpen, permission: 'media:read' },
    ],
  },
  {
    label: 'จัดการเว็บไซต์',
    items: [
      { label: 'จัดหน้าแรก', href: '/admin/homepage', icon: LayoutTemplate, permission: 'homepage:read' },
      { label: 'เมนูนำทาง', href: '/admin/navigation', icon: MenuIcon, permission: 'homepage:read' },
      { label: 'ตั้งค่าเว็บไซต์', href: '/admin/settings', icon: Settings, permission: 'homepage:read' },
    ],
  },
  {
    label: 'ระบบ',
    items: [
      { label: 'ข้อความติดต่อ', href: '/admin/messages', icon: Mail, permission: 'message:read' },
      { label: 'ผู้ใช้งานระบบ', href: '/admin/users', icon: ShieldCheck, superAdminOnly: true },
      { label: 'บันทึกการใช้งาน', href: '/admin/audit-logs', icon: History, permission: 'audit:read' },
      { label: 'สำรองข้อมูล', href: '/admin/backups', icon: DatabaseBackup, superAdminOnly: true },
    ],
  },
];
