import { apiClient, del, patch } from '../client';
import type { AdminMedia } from '@/types/adminContent';
import type { Paginated } from '@/types';

export interface MediaListParams {
  page?: number;
  limit?: number;
  search?: string;
  /** ชื่อโฟลเดอร์ — ส่งผ่าน query param "type" ตามที่ backend คาดหวัง */
  type?: string;
}

export interface MediaListResult {
  items: AdminMedia[];
  folders: { name: string; count: number }[];
  meta: Paginated<AdminMedia>['meta'];
}

export interface UploadResult {
  uploaded: AdminMedia[];
  failed: { name: string; reason: string }[];
}

export async function listMedia(params?: MediaListParams): Promise<MediaListResult> {
  const res = await apiClient.get<{
    data: { items: AdminMedia[]; folders: { name: string; count: number }[] };
    meta: Paginated<AdminMedia>['meta'];
  }>('/admin/media', { params });
  return { items: res.data.data.items, folders: res.data.data.folders, meta: res.data.meta };
}

export async function uploadMedia(files: File[], folder?: string): Promise<UploadResult> {
  const form = new FormData();
  for (const file of files) form.append('files', file);
  if (folder) form.append('folder', folder);
  const res = await apiClient.post<{ data: UploadResult }>('/admin/media/upload', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return res.data.data;
}

export const updateMediaAlt = (id: string, alt: string) => patch<AdminMedia>(`/admin/media/${id}`, { alt });
export const removeMedia = (id: string) => del(`/admin/media/${id}`);
