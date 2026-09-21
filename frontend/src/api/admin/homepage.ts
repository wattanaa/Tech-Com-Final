import { del, get, patch, post, put } from '../client';
import type { SectionType } from '@/types';

export interface HomepageSectionAdmin {
  id: string;
  type: SectionType;
  title: string | null;
  subtitle: string | null;
  order: number;
  isVisible: boolean;
  config: Record<string, unknown>;
}

export interface UpdateSectionInput {
  title?: string | null;
  subtitle?: string | null;
  isVisible?: boolean;
  config?: Record<string, unknown>;
}

export const listHomepageSections = () => get<HomepageSectionAdmin[]>('/admin/homepage/sections');
export const updateHomepageSection = (id: string, data: UpdateSectionInput) =>
  put<HomepageSectionAdmin>(`/admin/homepage/sections/${id}`, data);
export const reorderHomepageSections = (items: { id: string; order: number }[]) =>
  patch<HomepageSectionAdmin[]>('/admin/homepage/reorder', { items });
export const duplicateHomepageSection = (id: string) => post<HomepageSectionAdmin>(`/admin/homepage/sections/${id}/duplicate`);
export const removeHomepageSection = (id: string) => del(`/admin/homepage/sections/${id}`);
