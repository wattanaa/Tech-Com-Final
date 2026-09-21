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
/**
 * ค่าที่ "เขียน" กับ "อ่าน" ของ setting บางตัวรูปร่างต่างกัน (เช่น general.logoId
 * ตอนบันทึก vs general.logo ที่ backend แนบกลับมาตอนอ่าน) จึงรับ value เป็น unknown
 * แทนการผูกกับ SiteSettings[K] ตรง ๆ — backend เป็นคนตรวจ shape จริงอยู่แล้ว
 */
export const updateSetting = (key: keyof SiteSettings, value: unknown) =>
  put<SiteSettingRow>(`/admin/settings/${key}`, value);

export const listSeoAll = () => get<SeoSettingRow[]>('/admin/settings/seo/all');
export const upsertSeo = (data: SeoInput) => put<SeoSettingRow>('/admin/settings/seo/upsert', data);
