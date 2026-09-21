import { NavLink } from 'react-router-dom';
import { ADMIN_NAV } from '@/config/adminNav';
import { useAdminAuth } from '@/contexts/AdminAuthContext';
import { cn } from '@/utils/cn';

/** เนื้อหาเมนูล้วน ไม่มี wrapper ตำแหน่ง — ผู้เรียก (AdminLayout) จัดวางเป็น sidebar แบบ desktop หรือ drawer แบบ mobile เอง */
export function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  const { can, isSuperAdmin } = useAdminAuth();

  return (
    <nav className="flex flex-1 flex-col gap-5 overflow-y-auto">
      {ADMIN_NAV.map((group) => {
        const items = group.items.filter((item) => {
          if (item.superAdminOnly && !isSuperAdmin) return false;
          if (item.permission && !can(item.permission)) return false;
          return true;
        });
        if (items.length === 0) return null;

        return (
          <div key={group.label} className="flex flex-col gap-1">
            <p className="px-2.5 text-[11px] font-semibold uppercase tracking-wide text-ink-subtle">
              {group.label}
            </p>
            {items.map((item) => (
              <NavLink
                key={item.href}
                to={item.href}
                end={item.href === '/admin'}
                onClick={onNavigate}
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-2.5 rounded-sm px-2.5 py-2 text-sm font-medium text-ink-muted transition-colors hover:bg-brand-500/[0.08] hover:text-ink',
                    isActive && 'bg-brand-500/[0.12] text-brand-500',
                  )
                }
              >
                <item.icon className="size-[18px]" aria-hidden />
                {item.label}
              </NavLink>
            ))}
          </div>
        );
      })}
    </nav>
  );
}
