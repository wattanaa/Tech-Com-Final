import { del, get, patch, post, put } from '../client';

export interface NavigationItemAdmin {
  id: string;
  label: string;
  href: string;
  icon: string | null;
  order: number;
  isVisible: boolean;
  target: '_self' | '_blank';
  location: 'HEADER' | 'FOOTER';
  parentId: string | null;
  children?: NavigationItemAdmin[];
}

export interface NavigationInput {
  label: string;
  href: string;
  icon?: string;
  order: number;
  isVisible: boolean;
  target: '_self' | '_blank';
  location: 'HEADER' | 'FOOTER';
  parentId?: string;
}

export const listNavigationAdmin = () => get<NavigationItemAdmin[]>('/admin/navigation');
export const createNavigationItem = (data: NavigationInput) => post<NavigationItemAdmin>('/admin/navigation', data);
export const updateNavigationItem = (id: string, data: Partial<NavigationInput>) =>
  put<NavigationItemAdmin>(`/admin/navigation/${id}`, data);
export const removeNavigationItem = (id: string, force?: boolean) =>
  del(`/admin/navigation/${id}${force ? '?force=true' : ''}`);
export const reorderNavigation = (items: { id: string; order: number }[]) =>
  patch<{ updated: number }>('/admin/navigation/reorder', { items });
