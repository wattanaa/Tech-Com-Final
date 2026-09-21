import { Outlet } from 'react-router-dom';
import { AdminAuthProvider } from '@/contexts/AdminAuthContext';
import { ToastProvider } from '@/components/admin/Toast';
import { ConfirmProvider } from '@/components/admin/ConfirmDialog';

/** จุดเริ่มของทุก route ใต้ /admin — ให้ auth/toast/confirm context ใช้ร่วมกันทั้ง login page และหลัง login */
export function AdminRoot() {
  return (
    <AdminAuthProvider>
      <ToastProvider>
        <ConfirmProvider>
          <Outlet />
        </ConfirmProvider>
      </ToastProvider>
    </AdminAuthProvider>
  );
}
