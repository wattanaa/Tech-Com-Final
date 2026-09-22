import { useCallback, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'motion/react';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import type { GalleryImage } from '@/types';
import { resolveMediaUrl, isVideoMime } from '@/utils/media';

/** หน้าต่างดูภาพขยาย — รองรับปุ่มถัดไป/ก่อนหน้า และคีย์บอร์ด (← → Esc) */
export function Lightbox({
  images,
  index,
  onClose,
  onNavigate,
}: {
  images: GalleryImage[];
  index: number | null;
  onClose: () => void;
  onNavigate: (index: number) => void;
}) {
  const open = index !== null;

  const go = useCallback(
    (dir: number) => {
      if (index === null) return;
      const next = (index + dir + images.length) % images.length;
      onNavigate(next);
    },
    [index, images.length, onNavigate],
  );

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight') go(1);
      if (e.key === 'ArrowLeft') go(-1);
    };
    window.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [open, go, onClose]);

  const current = index !== null ? images[index] : null;

  return createPortal(
    <AnimatePresence>
      {open && current && (
        <motion.div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/85 p-4 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          role="dialog"
          aria-modal="true"
          aria-label="ดูภาพขยาย"
        >
          <button
            className="absolute right-4 top-4 grid size-11 place-items-center rounded-full bg-white/10 text-white hover:bg-white/20"
            onClick={onClose}
            aria-label="ปิด"
          >
            <X className="size-5" aria-hidden />
          </button>
          {images.length > 1 && (
            <>
              <button
                className="absolute left-4 grid size-11 place-items-center rounded-full bg-white/10 text-white hover:bg-white/20"
                onClick={(e) => { e.stopPropagation(); go(-1); }}
                aria-label="ภาพก่อนหน้า"
              >
                <ChevronLeft className="size-6" aria-hidden />
              </button>
              <button
                className="absolute right-4 top-1/2 grid size-11 -translate-y-1/2 place-items-center rounded-full bg-white/10 text-white hover:bg-white/20"
                onClick={(e) => { e.stopPropagation(); go(1); }}
                aria-label="ภาพถัดไป"
              >
                <ChevronRight className="size-6" aria-hidden />
              </button>
            </>
          )}
          <motion.figure
            key={current.id}
            className="flex max-h-full max-w-5xl flex-col items-center gap-3"
            initial={{ scale: 0.96, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            onClick={(e) => e.stopPropagation()}
          >
            {isVideoMime(current.media.mimeType) ? (
              <video
                src={resolveMediaUrl(current.media.url)}
                controls
                autoPlay
                playsInline
                className="max-h-[80vh] w-auto rounded-lg"
              />
            ) : (
              <img
                src={resolveMediaUrl(current.media.url)}
                alt={current.caption ?? current.media.alt ?? 'ภาพกิจกรรม'}
                className="max-h-[80vh] w-auto rounded-lg object-contain"
              />
            )}
            {current.caption && (
              <figcaption className="text-center text-sm text-white/80">{current.caption}</figcaption>
            )}
            <span className="font-mono text-xs text-white/50">
              {index! + 1} / {images.length}
            </span>
          </motion.figure>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  );
}
