import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { ArrowUp } from 'lucide-react';
import { scaleIn } from '@/animations/variants';
import { useReducedMotion } from '@/hooks/useReducedMotion';

const SCROLL_THRESHOLD = 480;

/** ปุ่มลอยเลื่อนกลับขึ้นบนสุด — โผล่มาเมื่อเลื่อนหน้าลงเกินระยะที่กำหนด */
export function BackToTopButton() {
  const [visible, setVisible] = useState(false);
  const reduced = useReducedMotion();

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > SCROLL_THRESHOLD);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const handleClick = () => {
    window.scrollTo({ top: 0, behavior: reduced ? 'instant' : 'smooth' });
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.button
          type="button"
          onClick={handleClick}
          aria-label="เลื่อนขึ้นด้านบน"
          className="glass-strong fixed right-4 z-30 grid size-11 place-items-center rounded-full border border-hairline/[0.16] text-ink-muted shadow-float transition-colors hover:text-brand-500"
          style={{ bottom: 'calc(env(safe-area-inset-bottom, 0px) + 1.5rem)' }}
          variants={reduced ? undefined : scaleIn}
          initial="hidden"
          animate="visible"
          exit="hidden"
        >
          <ArrowUp className="size-5" aria-hidden />
        </motion.button>
      )}
    </AnimatePresence>
  );
}
