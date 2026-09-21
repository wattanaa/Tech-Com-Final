import { apiClient, patch } from '../client';
import type { Paginated } from '@/types';

export type NotificationType =
  | 'NEWS_CREATED'
  | 'NEWS_REVIEW'
  | 'NEWS_PUBLISHED'
  | 'CONTACT_MESSAGE'
  | 'MEDIA_UPLOAD'
  | 'USER_LOGIN'
  | 'SECURITY_EVENT';

export interface NotificationRow {
  id: string;
  type: NotificationType;
  title: string;
  message: string | null;
  link: string | null;
  isRead: boolean;
  createdAt: string;
}

export interface NotificationListResult {
  items: NotificationRow[];
  unread: number;
  meta: Paginated<NotificationRow>['meta'];
}

export async function listNotifications(params?: { page?: number; limit?: number; status?: string }): Promise<NotificationListResult> {
  const res = await apiClient.get<{
    data: { items: NotificationRow[]; unread: number };
    meta: Paginated<NotificationRow>['meta'];
  }>('/admin/notifications', { params });
  return { items: res.data.data.items, unread: res.data.data.unread, meta: res.data.meta };
}

export const markNotificationRead = (id: string) => patch<{ updated: number }>(`/admin/notifications/${id}/read`);
export const markAllNotificationsRead = () => patch<{ updated: number }>('/admin/notifications/read-all');
