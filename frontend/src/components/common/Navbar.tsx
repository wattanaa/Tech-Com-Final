import { useEffect, useState } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'motion/react';
import { Cpu, Menu, Search, X } from 'lucide-react';
import { useNavigation, useSettings } from '@/hooks/useSiteData';
import { COLLEGE_NAME, SITE_NAME } from '@/constants/site';
import { ThemeToggle } from './ThemeToggle';
import { cn } from '@/utils/cn';
import { resolveMediaUrl } from '@/utils/media';

/** แถบนำทางบนสุด — sticky + glassmorphism, เมนูบนจอใหญ่ / drawer บนมือถือ */
export function Navbar() {
  const nav = useNavigation();
  const settings = useSettings();
  const logo = settings.general?.logo;
  const location = useLocation();
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // ปิด drawer ทุกครั้งที่เปลี่ยนหน้า
  useEffect(() => setOpen(false), [location.pathname]);

  return (
    <header
      className="sticky z-40 px-4"
      style={{ top: 'env(safe-area-inset-top, 0px)' }}
    >
      <nav
        className={cn(
          'mx-auto mt-3 flex max-w-6xl items-center gap-4 rounded-lg border px-4 py-2.5 transition-all duration-300',
          scrolled
            ? 'glass-strong border-hairline/[0.16] shadow-card'
            : 'glass border-hairline/[0.10]',
        )}
      >
        <Link to="/" className="flex shrink-0 items-center gap-2.5">
          {logo ? (
            <img
              src={resolveMediaUrl(logo.thumbnailUrl ?? logo.url)}
              alt={logo.alt ?? SITE_NAME}
              className="size-9 shrink-0 rounded-sm object-contain"
            />
          ) : (
            <span className="grid size-9 place-items-center rounded-sm bg-gradient-to-br from-brand-400 to-brand-700 text-white shadow-glow">
              <Cpu className="size-[18px]" aria-hidden />
            </span>
          )}
          <span className="leading-tight">
            <span className="block font-display text-[13px] font-bold">{SITE_NAME}</span>
            <span className="block text-[10.5px] text-ink-subtle">{COLLEGE_NAME}</span>
          </span>
        </Link>

        <ul className="mx-auto hidden items-center gap-0.5 lg:flex">
          {nav.map((item) => (
            <li key={item.id}>
              <NavLink
                to={item.href}
                end={item.href === '/'}
                className={({ isActive }) =>
                  cn(
                    'rounded-sm px-3 py-2 text-[13px] transition-colors hover:bg-brand-500/[0.08] hover:text-brand-500',
                    isActive ? 'font-semibold text-brand-500' : 'text-ink-muted',
                  )
                }
              >
                {item.label}
              </NavLink>
            </li>
          ))}
        </ul>

        <div className="ml-auto flex items-center gap-2 lg:ml-0">
          <button
            onClick={() => navigate('/search')}
            aria-label="ค้นหา"
            className="grid size-9 place-items-center rounded-sm border border-hairline/15 bg-surface/60 text-ink-muted transition-colors hover:border-hairline/30 hover:text-brand-500"
          >
            <Search className="size-[18px]" aria-hidden />
          </button>
          <ThemeToggle />
          <button
            onClick={() => setOpen((v) => !v)}
            aria-label={open ? 'ปิดเมนู' : 'เปิดเมนู'}
            aria-expanded={open}
            className="grid size-9 place-items-center rounded-sm border border-hairline/15 bg-surface/60 text-ink-muted transition-colors hover:text-brand-500 lg:hidden"
          >
            {open ? <X className="size-[18px]" aria-hidden /> : <Menu className="size-[18px]" aria-hidden />}
          </button>
        </div>
      </nav>

      {/* Drawer มือถือ */}
      <AnimatePresence>
        {open && (
          <motion.div
            className="glass-strong mx-auto mt-2 max-w-6xl overflow-hidden rounded-lg border border-hairline/[0.16] shadow-card lg:hidden"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
          >
            <ul className="flex flex-col p-2">
              {nav.map((item) => (
                <li key={item.id}>
                  <NavLink
                    to={item.href}
                    end={item.href === '/'}
                    className={({ isActive }) =>
                      cn(
                        'block rounded-sm px-3 py-2.5 text-sm transition-colors hover:bg-brand-500/[0.08]',
                        isActive ? 'font-semibold text-brand-500' : 'text-ink-muted',
                      )
                    }
                  >
                    {item.label}
                  </NavLink>
                </li>
              ))}
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
