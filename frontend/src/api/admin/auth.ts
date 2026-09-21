import { apiClient, get, post } from '../client';
import type { AdminUser, LoginInput } from '@/types/admin';

/** ผลลัพธ์จาก POST /auth/login — เป็นชุดข้อมูลย่อกว่า AdminUser (ไม่มี phone/avatar/lastLoginAt) */
export interface LoginResult {
  id: string;
  email: string;
  name: string;
  roleName: 'SUPER_ADMIN' | 'ADMIN' | 'EDITOR';
  roleLevel: number;
  permissions: string[];
}

export const login = (body: LoginInput) => post<LoginResult>('/auth/login', body);

/** /auth/logout ตอบ 204 ไม่มี body — ใช้ apiClient ตรงแทน post<T>() ที่คาดหวัง { data } */
export const logout = () => apiClient.post('/auth/logout');

export const getMe = () => get<AdminUser>('/auth/me');
