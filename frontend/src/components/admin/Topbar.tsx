import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, Menu, User } from 'lucide-react';
import { useAdminAuth } from '@/contexts/AdminAuthContext';
import { ThemeToggle } from '@/components/common/ThemeToggle';
import { NotificationBell } from './NotificationBell';
import { useToast } from './Toast';

export function Topbar({ onMenuClick }: { onMenuClick: () => void }) {
  const { user, logout } = useAdminAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/admin/login', { replace: true });
    } catch {
      toast.error('ออกจากระบบไม่สำเร็จ กรุณาลองใหม่อีกครั้ง');
    }
  };

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-hairline/15 bg-surface/70 px-4 backdrop-blur-md sm:px-6">
      <button
        onClick={onMenuClick}
        className="grid size-9 place-items-center rounded-sm text-ink-muted hover:bg-brand-500/[0.08] lg:hidden"
        aria-label="เปิดเมนู"
      >
        <Menu className="size-5" aria-hidden />
      </button>

      <div className="flex flex-1 items-center justify-end gap-3">
        <NotificationBell />
        <ThemeToggle />

        <div className="relative">
          <button
            onClick={() => setMenuOpen((v) => !v)}
            className="flex items-center gap-2.5 rounded-sm border border-hairline/15 bg-surface/60 py-1.5 pl-1.5 pr-3 text-sm hover:border-hairline/30"
            aria-haspopup="menu"
            aria-expanded={menuOpen}
          >
            <span className="grid size-7 place-items-center rounded-full bg-brand-500/[0.15] text-brand-500">
              <User className="size-4" aria-hidden />
            </span>
            <span className="hidden text-left sm:block">
              <span className="block font-medium text-ink">{user?.name}</span>
              <span className="block text-xs text-ink-subtle">{user?.role.label}</span>
            </span>
          </button>

          {menuOpen && (
            <>
              <button
                className="fixed inset-0 z-10 cursor-default"
                aria-hidden
                tabIndex={-1}
                onClick={() => setMenuOpen(false)}
              />
              <div
                role="menu"
                className="absolute right-0 top-full z-20 mt-2 w-44 overflow-hidden rounded-sm border border-hairline/15 bg-surface shadow-float"
              >
                <button
                  role="menuitem"
                  onClick={handleLogout}
                  className="flex w-full items-center gap-2.5 px-3.5 py-2.5 text-left text-sm text-ink-muted hover:bg-danger/[0.08] hover:text-danger"
                >
                  <LogOut className="size-4" aria-hidden />
                  ออกจากระบบ
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
