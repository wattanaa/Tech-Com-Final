import { useEffect, useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Sidebar } from '@/components/admin/Sidebar';
import { Topbar } from '@/components/admin/Topbar';

/** โครงหน้าหลังบ้านหลัง login แล้ว — sidebar (desktop คงที่ / mobile เป็น drawer) + topbar + เนื้อหา */
export function AdminLayout() {
  const { pathname } = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
    setMobileOpen(false);
  }, [pathname]);

  return (
    <div className="flex min-h-dvh bg-canvas">
      <a href="#admin-main" className="skip-link">ข้ามไปยังเนื้อหาหลัก</a>

      <aside className="hidden w-64 shrink-0 border-r border-hairline/15 bg-surface/60 lg:block">
        <div className="sticky top-0 flex h-dvh flex-col gap-6 p-5">
          <Brand />
          <Sidebar />
        </div>
      </aside>

      {mobileOpen && (
        <div className="fixed inset-0 z-30 lg:hidden">
          <button
            className="absolute inset-0 bg-black/50"
            aria-label="ปิดเมนู"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="absolute inset-y-0 left-0 flex w-72 flex-col gap-6 bg-surface p-5 shadow-float">
            <Brand />
            <Sidebar onNavigate={() => setMobileOpen(false)} />
          </aside>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar onMenuClick={() => setMobileOpen((v) => !v)} />
        <main id="admin-main" className="flex-1 p-4 sm:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

function Brand() {
  return (
    <div className="px-2">
      <p className="font-display text-sm font-bold text-ink">TCOM หลังบ้าน</p>
      <p className="text-xs text-ink-subtle">แผนกวิชาเทคโนโลยีคอมพิวเตอร์</p>
    </div>
  );
}
