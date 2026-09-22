/**
 * ชนิดข้อมูลที่ตรงกับที่ API ฝั่ง backend ส่งกลับมา
 * (โมเดล Prisma + include เฉพาะฟิลด์ที่หน้าเว็บใช้จริง)
 */

export interface Media {
  id: string;
  url: string;
  thumbnailUrl?: string | null;
  alt?: string | null;
  width?: number | null;
  height?: number | null;
  mimeType?: string | null;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  color: string;
}

export type ContentStatus = 'DRAFT' | 'REVIEW' | 'APPROVED' | 'PUBLISHED' | 'ARCHIVED';
export type ProgramLevel = 'POR_WOR_CHOR' | 'POR_WOR_SOR';
export type TeacherType = 'HEAD' | 'TEACHER' | 'STAFF';

export interface News {
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
  author?: { name: string } | null;
  coverImage?: Media | null;
  createdAt: string;
}

export interface Activity {
  id: string;
  title: string;
  slug: string;
  description: string;
  content?: string | null;
  startDate: string;
  endDate?: string | null;
  location?: string | null;
  views: number;
  category?: Category | null;
  coverImage?: Media | null;
}

export interface ProjectMember {
  student?: { firstName: string; lastName: string; prefix: string } | null;
  role?: string | null;
}

export interface Project {
  id: string;
  name: string;
  slug: string;
  description: string;
  year: number;
  technologies: string[];
  demoUrl?: string | null;
  githubUrl?: string | null;
  award?: string | null;
  category?: Category | null;
  advisor?: { prefix: string; firstName: string; lastName: string } | null;
  coverImage?: Media | null;
  members?: ProjectMember[];
}

export interface Teacher {
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
  photo?: Media | null;
  order: number;
}

export interface Program {
  id: string;
  code: string;
  name: string;
  nameEn?: string | null;
  level: ProgramLevel;
  duration: string;
  description: string;
  skills: string[];
  image?: Media | null;
}

export interface Course {
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
  program?: { id: string; name: string; level: ProgramLevel } | null;
  image?: Media | null;
}

export interface Facility {
  id: string;
  name: string;
  slug: string;
  description: string;
  computerCount: number;
  software: string[];
  equipment: string[];
  location?: string | null;
  coverImage?: Media | null;
}

export interface GalleryImage {
  id: string;
  caption?: string | null;
  order: number;
  media: Media;
}

export interface Album {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  eventDate?: string | null;
  coverImage?: Media | null;
  images: GalleryImage[];
}

export type SectionType =
  | 'HERO' | 'STATISTICS' | 'ABOUT' | 'PROGRAMS' | 'COURSES' | 'TEACHERS'
  | 'PROJECTS' | 'ACTIVITIES' | 'NEWS' | 'GALLERY' | 'FACILITIES' | 'CONTACT';

export interface HomepageSection {
  id: string;
  type: SectionType;
  title?: string | null;
  subtitle?: string | null;
  order: number;
  config: Record<string, unknown>;
}

export interface NavigationItem {
  id: string;
  label: string;
  href: string;
  icon?: string | null;
  order: number;
  children?: NavigationItem[];
}

export interface SiteSettings {
  general?: { siteName?: string; collegeName?: string; tagline?: string; logo?: Media | null };
  about?: {
    history?: string;
    vision?: string;
    mission?: string[];
    strengths?: string[];
    goals?: string[];
  };
  contact?: {
    address?: string;
    phone?: string;
    email?: string;
    mapEmbedUrl?: string;
    officeHours?: string;
  };
  social?: { facebook?: string; youtube?: string; line?: string; tiktok?: string };
  footer?: {
    description?: string;
    copyright?: string;
    quickLinks?: { label: string; href: string }[];
  };
}

export interface Paginated<T> {
  items: T[];
  meta: { total: number; page: number; limit: number; totalPages: number };
}

export interface SearchGroup {
  type: string;
  label: string;
  count: number;
  items: { id: string; title: string; href: string; subtitle?: string | null }[];
}
