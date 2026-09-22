import { Suspense, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'motion/react';
import { Navbar } from '@/components/common/Navbar';
import { Footer } from '@/components/common/Footer';
import { BackToTopButton } from '@/components/common/BackToTopButton';
import { Spinner } from '@/components/ui/feedback';
import { pageTransition } from '@/animations/variants';
import { useReducedMotion } from '@/hooks/useReducedMotion';

/** โครงหน้าเว็บสาธารณะ — Navbar + เนื้อหา + Footer พร้อมเลื่อนขึ้นบนสุดเมื่อเปลี่ยนหน้า */
export function PublicLayout() {
  const { pathname } = useLocation();
  const reduced = useReducedMotion();

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
  }, [pathname]);

  return (
    <div className="flex min-h-dvh flex-col">
      <a href="#main" className="skip-link">ข้ามไปยังเนื้อหาหลัก</a>
      <Navbar />
      <main id="main" className="flex-1">
        <AnimatePresence mode="wait">
          <motion.div
            key={pathname}
            variants={reduced ? undefined : pageTransition}
            initial="initial"
            animate="animate"
            exit="exit"
          >
            <Suspense fallback={<div className="pt-24"><Spinner /></div>}>
              <Outlet />
            </Suspense>
          </motion.div>
        </AnimatePresence>
      </main>
      <Footer />
      <BackToTopButton />
    </div>
  );
}
