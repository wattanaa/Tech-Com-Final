import { get } from '../client';

export interface RoleOption {
  id: string;
  name: 'SUPER_ADMIN' | 'ADMIN' | 'EDITOR';
  label: string;
  description: string | null;
  level: number;
  userCount: number;
  permissions: { key: string; label: string; group: string }[];
}

export const listRoles = () => get<RoleOption[]>('/admin/users/roles');
