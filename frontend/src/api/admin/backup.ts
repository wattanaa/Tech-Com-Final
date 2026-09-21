import { del, get, post } from '../client';

export type BackupType = 'DATABASE' | 'MEDIA' | 'FULL';
export type BackupStatus = 'PENDING' | 'RUNNING' | 'SUCCESS' | 'FAILED';

export interface BackupRow {
  id: string;
  filename: string;
  type: BackupType;
  status: BackupStatus;
  size: number;
  note: string | null;
  createdAt: string;
  createdBy: { id: string; name: string } | null;
}

/** ข้อความยืนยันต้องตรงตัวตามที่ backend บังคับ ("ยืนยันการกู้คืน") — ป้องกันเรียก API ตรงโดยไม่ตั้งใจ */
const RESTORE_CONFIRM_TEXT = 'ยืนยันการกู้คืน';

export const listBackups = () => get<BackupRow[]>('/admin/backups');
export const createBackup = () => post<BackupRow & { message: string }>('/admin/backups');
export const restoreBackup = (id: string) =>
  post<{ message: string }>(`/admin/backups/${id}/restore`, { confirm: RESTORE_CONFIRM_TEXT });
export const removeBackup = (id: string) => del(`/admin/backups/${id}`);
