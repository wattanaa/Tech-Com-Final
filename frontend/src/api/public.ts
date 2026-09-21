import { apiClient, get, post } from './client';
import type {
  Activity, Album, Course, Facility, HomepageSection, NavigationItem,
  News, Paginated, Program, Project, SearchGroup, SiteSettings, Teacher,
} from '@/types';

/** พารามิเตอร์มาตรฐานของทุก endpoint แบบรายการ */
export interface ListParams {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  order?: 'asc' | 'desc';
  categoryId?: string;
  [key: string]: unknown;
}

/**
 * ดึงข้อมูลแบบรายการ พร้อม meta สำหรับ pagination
 * (get() ปกติจะตัด meta ทิ้ง จึงเรียก apiClient ตรงเพื่อเก็บทั้ง data และ meta)
 */
export async function getList<T>(url: string, params?: ListParams): Promise<Paginated<T>> {
  const res = await apiClient.get<{ data: T[]; meta: Paginated<T>['meta'] }>(url, { params });
  return {
    items: res.data.data,
    meta: res.data.meta ?? { total: res.data.data.length, page: 1, limit: res.data.data.length, totalPages: 1 },
  };
}

// ── การตั้งค่าเว็บไซต์ · เมนู · หน้าแรก ──────────────────────
export const getSettings = () => get<SiteSettings>('/settings');
export const getNavigation = () => get<NavigationItem[]>('/navigation', { location: 'HEADER' });
export const getHomepageSections = () => get<HomepageSection[]>('/homepage/sections');

// ── เนื้อหา (รายการ) ────────────────────────────────────────
export const getNews = (p?: ListParams) => getList<News>('/news', p);
export const getActivities = (p?: ListParams) => getList<Activity>('/activities', p);
export const getProjects = (p?: ListParams) => getList<Project>('/projects', p);
export const getTeachers = (p?: ListParams) => getList<Teacher>('/teachers', { limit: 100, ...p });
export const getPrograms = (p?: ListParams) => getList<Program>('/programs', { limit: 100, ...p });
export const getCourses = (p?: ListParams) => getList<Course>('/courses', p);
export const getFacilities = (p?: ListParams) => getList<Facility>('/facilities', { limit: 100, ...p });

// ── เนื้อหา (รายละเอียด) ────────────────────────────────────
export const getNewsBySlug = (slug: string) => get<News>(`/news/${slug}`);
export const getProjectBySlug = (slug: string) => get<Project>(`/projects/${slug}`);
export const getActivityBySlug = (slug: string) => get<Activity>(`/activities/${slug}`);
export const getProgramByCode = (code: string) => get<Program>(`/programs/${code}`);
export const getCourseByCode = (code: string) => get<Course>(`/courses/${code}`);
export const getTeacherById = (id: string) => get<Teacher>(`/teachers/${id}`);
export const getFacilityBySlug = (slug: string) => get<Facility>(`/facilities/${slug}`);

// ── คลังภาพ ─────────────────────────────────────────────────
export const getAlbums = () => get<Album[]>('/gallery');

// ── ค้นหา ───────────────────────────────────────────────────
export const search = (q: string) =>
  get<{ query: string; total: number; groups: SearchGroup[] }>('/search', { q });

// ── ฟอร์มติดต่อ ─────────────────────────────────────────────
export interface ContactInput {
  name: string;
  email: string;
  phone?: string;
  subject: string;
  message: string;
}
export const sendContact = (body: ContactInput) => post<{ id: string }>('/contact', body);
