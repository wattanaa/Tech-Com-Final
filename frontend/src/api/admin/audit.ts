import { apiClient } from '../client';
import type { Paginated } from '@/types';

export type AuditAction = 'CREATE' | 'UPDATE' | 'DELETE' | 'LOGIN' | 'LOGOUT' | 'PUBLISH' | 'UNPUBLISH' | 'RESTORE';

export interface AuditLogRow {
  id: string;
  action: AuditAction;
  entity: string;
  entityId: string | null;
  changes: unknown;
  ipAddress: string | null;
  createdAt: string;
  user: { id: string; name: string; email: string } | null;
}

export interface AuditLogFilters {
  entities: { name: string; count: number }[];
  users: { id: string; name: string }[];
  actions: AuditAction[];
}

export interface AuditLogListParams {
  page?: number;
  limit?: number;
  search?: string;
  /** ชื่อ query param แปลกเพราะตามที่ backend กำหนดไว้: type = action, status = entity */
  type?: AuditAction;
  status?: string;
  from?: string;
  to?: string;
}

export async function listAuditLogs(params?: AuditLogListParams): Promise<Paginated<AuditLogRow>> {
  const res = await apiClient.get<{ data: AuditLogRow[]; meta: Paginated<AuditLogRow>['meta'] }>('/admin/audit-logs', {
    params,
  });
  return { items: res.data.data, meta: res.data.meta };
}

export async function getAuditLogFilters(): Promise<AuditLogFilters> {
  const res = await apiClient.get<{ data: AuditLogFilters }>('/admin/audit-logs/filters');
  return res.data.data;
}
