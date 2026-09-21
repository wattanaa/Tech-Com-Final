import { createContext, useCallback, useContext, type ReactNode } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getMe, login as loginApi, logout as logoutApi } from '@/api/admin/auth';
import type { AdminUser, LoginInput } from '@/types/admin';

const ME_QUERY_KEY = ['admin', 'me'] as const;

interface AdminAuthContextValue {
  user: AdminUser | null;
  status: 'loading' | 'authenticated' | 'unauthenticated';
  isSuperAdmin: boolean;
  can: (permission: string) => boolean;
  login: (input: LoginInput) => Promise<AdminUser>;
  logout: () => Promise<void>;
}

const AdminAuthContext = createContext<AdminAuthContextValue | null>(null);

/**
 * แหล่งความจริงเดียวของสถานะล็อกอินฝั่งหลังบ้าน — เก็บด้วย TanStack Query
 * (ไม่ใช้ useState) เพื่อให้ cache invalidation หลัง login/logout ทำงานสอดคล้อง
 * กับข้อมูลอื่นที่ผูกกับผู้ใช้ (เช่น permission-gated query ในหน้าอื่น) โดยอัตโนมัติ
 */
export function AdminAuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();

  const meQuery = useQuery({
    queryKey: ME_QUERY_KEY,
    queryFn: getMe,
    retry: false,
    staleTime: 5 * 60_000,
  });

  const login = useCallback(
    async (input: LoginInput) => {
      await loginApi(input);
      return queryClient.fetchQuery({ queryKey: ME_QUERY_KEY, queryFn: getMe });
    },
    [queryClient],
  );

  const logout = useCallback(async () => {
    await logoutApi();
    // ล้าง cache ทั้งหมด ไม่ใช่แค่ me — กันข้อมูลของผู้ใช้คนก่อนหลงเหลือให้เห็นตอนคนถัดไป login
    queryClient.clear();
  }, [queryClient]);

  const user = meQuery.data ?? null;
  const status: AdminAuthContextValue['status'] = meQuery.isLoading
    ? 'loading'
    : user
      ? 'authenticated'
      : 'unauthenticated';

  const can = useCallback((permission: string) => user?.permissions.includes(permission) ?? false, [user]);

  return (
    <AdminAuthContext.Provider
      value={{ user, status, isSuperAdmin: user?.role.name === 'SUPER_ADMIN', can, login, logout }}
    >
      {children}
    </AdminAuthContext.Provider>
  );
}

export function useAdminAuth(): AdminAuthContextValue {
  const ctx = useContext(AdminAuthContext);
  if (!ctx) throw new Error('useAdminAuth ต้องถูกเรียกภายใน AdminAuthProvider');
  return ctx;
}
