import { get, put } from '../client';
import type { SiteSettings } from '@/types';

export interface SiteSettingRow {
  key: string;
  group: string;
  value: unknown;
}

export interface SeoSettingRow {
  id: string;
  path: string;
  title: string;
  description: string | null;
  keywords: string[];
  ogImageId: string | null;
  canonical: string | null;
}

export interface SeoInput {
  path: string;
  title: string;
  description?: string | null;
  keywords: string[];
  ogImageId?: string | null;
  canonical?: string | null;
}

export const listSettings = () => get<SiteSettingRow[]>('/admin/settings');
export const updateSetting = <K extends keyof SiteSettings>(key: K, value: SiteSettings[K]) =>
  put<SiteSettingRow>(`/admin/settings/${key}`, value);

export const listSeoAll = () => get<SeoSettingRow[]>('/admin/settings/seo/all');
export const upsertSeo = (data: SeoInput) => put<SeoSettingRow>('/admin/settings/seo/upsert', data);
