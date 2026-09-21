import { apiClient, del, patch } from '../client';
import type { Paginated } from '@/types';

export interface ContactMessageRow {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  subject: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}

export interface MessageListResult {
  items: ContactMessageRow[];
  unread: number;
  meta: Paginated<ContactMessageRow>['meta'];
}

export async function listMessages(params?: { page?: number; limit?: number; search?: string; status?: string }): Promise<MessageListResult> {
  const res = await apiClient.get<{ data: { items: ContactMessageRow[]; unread: number }; meta: Paginated<ContactMessageRow>['meta'] }>(
    '/admin/messages',
    { params },
  );
  return { items: res.data.data.items, unread: res.data.data.unread, meta: res.data.meta };
}

export const markMessageRead = (id: string) => patch<ContactMessageRow>(`/admin/messages/${id}/read`);
export const removeMessage = (id: string) => del(`/admin/messages/${id}`);
