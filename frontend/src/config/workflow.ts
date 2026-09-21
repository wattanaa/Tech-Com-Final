import type { ContentStatus } from '@/api/admin/resource';

/** ต้องตรงกับ backend/src/config/constants.ts WORKFLOW_TRANSITIONS เป๊ะ — เปลี่ยนที่นี่ก็ต้องเปลี่ยนที่นั่นด้วย */
export const WORKFLOW_TRANSITIONS: Record<ContentStatus, ContentStatus[]> = {
  DRAFT: ['REVIEW', 'ARCHIVED'],
  REVIEW: ['DRAFT', 'APPROVED'],
  APPROVED: ['REVIEW', 'PUBLISHED'],
  PUBLISHED: ['ARCHIVED'],
  ARCHIVED: ['DRAFT', 'PUBLISHED'],
};

export const STATUS_LABEL: Record<ContentStatus, string> = {
  DRAFT: 'ฉบับร่าง',
  REVIEW: 'รอตรวจ',
  APPROVED: 'อนุมัติแล้ว',
  PUBLISHED: 'เผยแพร่แล้ว',
  ARCHIVED: 'เก็บถาวร',
};

export const STATUS_COLOR: Record<ContentStatus, string> = {
  DRAFT: '#94a3b8',
  REVIEW: '#f59e0b',
  APPROVED: '#0ea5e9',
  PUBLISHED: '#16a34a',
  ARCHIVED: '#64748b',
};

/** สถานะปลายทางที่ต้องมีสิทธิ์ :publish ถึงจะเปลี่ยนได้ — ต้องตรงกับ resource.service.ts */
export const PUBLISH_GATED_STATUSES: ContentStatus[] = ['APPROVED', 'PUBLISHED'];
