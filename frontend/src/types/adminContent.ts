/**
 * ชนิดข้อมูลฝั่งหลังบ้านสำหรับ entity แบบง่าย (ไม่มี status/version) —
 * ตรงกับ adminInclude ใน backend/src/resources/index.ts ต่าง จาก src/types/index.ts
 * ที่เป็น shape สำหรับหน้าเว็บสาธารณะเท่านั้น (ไม่มี isVisible/updatedAt ฯลฯ)
 */
import type { Category, ContentStatus, Media, ProgramLevel, TeacherType } from './index';

export interface AdminNews {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  status: ContentStatus;
  publishedAt: string | null;
  views: number;
  isPinned: boolean;
  category?: Category | null;
  coverImage?: Media | null;
  author?: { id: string; name: string } | null;
  updatedAt: string;
}

export interface AdminActivity {
  id: string;
  title: string;
  slug: string;
  description: string;
  content?: string | null;
  startDate: string;
  endDate?: string | null;
  location?: string | null;
  status: ContentStatus;
  views: number;
  category?: Category | null;
  coverImage?: Media | null;
  updatedAt: string;
}

export interface AdminProjectMember {
  role?: string | null;
  student: { id: string; prefix: string; firstName: string; lastName: string };
}

export interface AdminProject {
  id: string;
  name: string;
  slug: string;
  description: string;
  year: number;
  technologies: string[];
  demoUrl?: string | null;
  githubUrl?: string | null;
  award?: string | null;
  status: ContentStatus;
  category?: Category | null;
  advisor?: { id: string; prefix: string; firstName: string; lastName: string } | null;
  coverImage?: Media | null;
  members?: AdminProjectMember[];
  updatedAt: string;
}

export interface AdminTeacher {
  id: string;
  prefix: string;
  firstName: string;
  lastName: string;
  position: string;
  academicRank?: string | null;
  type: TeacherType;
  specialties: string[];
  bio?: string | null;
  email?: string | null;
  phone?: string | null;
  facebook?: string | null;
  line?: string | null;
  order: number;
  isVisible: boolean;
  photo?: Media | null;
  updatedAt: string;
}

export interface AdminStudent {
  id: string;
  studentCode: string;
  prefix: string;
  firstName: string;
  lastName: string;
  level: string;
  classRoom?: string | null;
  year: number;
  isVisible: boolean;
  program?: { id: string; code: string; name: string } | null;
  photo?: Media | null;
  updatedAt: string;
}

export interface AdminProgram {
  id: string;
  code: string;
  name: string;
  nameEn?: string | null;
  level: ProgramLevel;
  duration: string;
  description: string;
  skills: string[];
  order: number;
  isVisible: boolean;
  image?: Media | null;
  updatedAt: string;
}

export interface AdminCourse {
  id: string;
  code: string;
  name: string;
  nameEn?: string | null;
  credits: number;
  hours: number;
  theoryHours: number;
  practiceHours: number;
  description: string;
  term?: string | null;
  isVisible: boolean;
  program?: { id: string; code: string; name: string } | null;
  teachers?: { teacher: { id: string; prefix: string; firstName: string; lastName: string } }[];
  image?: Media | null;
  updatedAt: string;
}

export interface AdminFacility {
  id: string;
  name: string;
  slug: string;
  description: string;
  computerCount: number;
  software: string[];
  equipment: string[];
  location?: string | null;
  order: number;
  isVisible: boolean;
  coverImage?: Media | null;
  updatedAt: string;
}

export interface AdminAlbum {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  eventDate?: string | null;
  isPublished: boolean;
  order: number;
  coverImage?: Media | null;
  _count?: { images: number };
  updatedAt: string;
}

export interface AdminUserRow {
  id: string;
  email: string;
  name: string;
  phone: string | null;
  isActive: boolean;
  lastLoginAt: string | null;
  createdAt: string;
  lockedUntil: string | null;
  role: { id: string; name: 'SUPER_ADMIN' | 'ADMIN' | 'EDITOR'; label: string; level: number };
  avatar: { id: string; url: string; thumbnailUrl: string | null } | null;
}

export interface AdminMedia {
  id: string;
  url: string;
  thumbnailUrl?: string | null;
  alt?: string | null;
  originalName: string;
  mimeType: string;
  size: number;
  width?: number | null;
  height?: number | null;
  folder: string;
  uploadedBy?: { id: string; name: string } | null;
  createdAt: string;
}

export interface AdminCategory {
  id: string;
  name: string;
  slug: string;
  type: 'NEWS' | 'ACTIVITY' | 'PROJECT';
  color: string;
  order: number;
  updatedAt: string;
}
