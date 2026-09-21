import { apiClient, del, get, patch, post, put } from '../client';
import type { Paginated } from '@/types';

export interface ListParams {
  page?: number;
  limit?: number;
  search?: string;
  [key: string]: unknown;
}

async function getList<T>(url: string, params?: ListParams): Promise<Paginated<T>> {
  const res = await apiClient.get<{ data: T[]; meta: Paginated<T>['meta'] }>(url, { params });
  return {
    items: res.data.data,
    meta: res.data.meta ?? { total: res.data.data.length, page: 1, limit: res.data.data.length, totalPages: 1 },
  };
}

export interface ContentVersionSummary {
  id: string;
  version: number;
  note: string | null;
  createdAt: string;
  changedBy: { id: string; name: string } | null;
}

export interface VersionDiff {
  from: number;
  to: number;
  fields: Record<string, { from: unknown; to: unknown }>;
}

export type ContentStatus = 'DRAFT' | 'REVIEW' | 'APPROVED' | 'PUBLISHED' | 'ARCHIVED';

/**
 * สร้างชุดฟังก์ชันเรียก API มาตรฐานสำหรับ entity ที่ใช้ generic resource router
 * ของ backend (ดู backend/src/resources/index.ts) — ทุก entity มีรูปแบบ endpoint
 * เหมือนกันทุกตัวอักษร ต่างกันแค่ route ชื่อ entity
 * changeStatus/listVersions ใช้ได้เฉพาะ entity ที่ hasStatus/versioned เป็น true เท่านั้น
 */
export function createResourceApi<TItem, TInput extends Record<string, unknown>>(route: string) {
  const base = `/admin/${route}`;
  return {
    list: (params?: ListParams) => getList<TItem>(base, params),
    get: (id: string) => get<TItem>(`${base}/${id}`),
    create: (data: TInput) => post<TItem>(base, data),
    update: (id: string, data: Partial<TInput> & { updatedAt?: string }) => put<TItem>(`${base}/${id}`, data),
    remove: (id: string) => del(`${base}/${id}`),
    changeStatus: (id: string, status: ContentStatus) => patch<TItem>(`${base}/${id}/status`, { status }),
    listVersions: (id: string) => get<ContentVersionSummary[]>(`${base}/${id}/versions`),
    compareVersions: (id: string, from: number, to: number) =>
      get<VersionDiff>(`${base}/${id}/versions/compare`, { from, to }),
    restoreVersion: (id: string, version: number) => post<TItem>(`${base}/${id}/versions/${version}/restore`),
  };
}
