import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAdminAuth } from '@/contexts/AdminAuthContext';
import { Spinner } from '@/components/ui/feedback';

/** กันทุก route ใต้นี้ไม่ให้เข้าถึงได้ก่อน login — เด้งไป /admin/login พร้อมจำหน้าที่ตั้งใจจะไปกลับไปด้วย */
export function ProtectedRoute() {
  const { status } = useAdminAuth();
  const location = useLocation();

  if (status === 'loading') {
    return (
      <div className="grid min-h-dvh place-items-center bg-canvas">
        <Spinner label="กำลังตรวจสอบสิทธิ์เข้าใช้งาน" />
      </div>
    );
  }

  if (status === 'unauthenticated') {
    const redirect = encodeURIComponent(location.pathname + location.search);
    return <Navigate to={`/admin/login?redirect=${redirect}`} replace />;
  }

  return <Outlet />;
}
