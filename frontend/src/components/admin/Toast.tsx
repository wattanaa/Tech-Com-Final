import { createContext, useCallback, useContext, useState, type ReactNode } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { CheckCircle2, X, XCircle } from 'lucide-react';
import { cn } from '@/utils/cn';
import { toastSlide } from '@/animations/variants';
import { useReducedMotion } from '@/hooks/useReducedMotion';

type ToastVariant = 'success' | 'error';
interface ToastItem {
  id: number;
  message: string;
  variant: ToastVariant;
}

interface ToastContextValue {
  success: (message: string) => void;
  error: (message: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

let nextId = 1;

/** แจ้งผลลัพธ์ของการกระทำ (บันทึกสำเร็จ/ผิดพลาด) — ทุกหน้า CRUD หลังบ้านใช้ตัวนี้ร่วมกัน */
export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const reduced = useReducedMotion();

  const dismiss = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const push = useCallback(
    (message: string, variant: ToastVariant) => {
      const id = nextId++;
      setToasts((prev) => [...prev, { id, message, variant }]);
      setTimeout(() => dismiss(id), 4000);
    },
    [dismiss],
  );

  const value: ToastContextValue = {
    success: (message) => push(message, 'success'),
    error: (message) => push(message, 'error'),
  };

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        className="pointer-events-none fixed inset-x-4 bottom-4 z-[100] flex flex-col items-stretch gap-2 sm:inset-x-auto sm:right-4 sm:items-end"
        aria-live="polite"
      >
        <AnimatePresence>
          {toasts.map((t) => (
            <motion.div
              key={t.id}
              role="status"
              layout={!reduced}
              variants={reduced ? undefined : toastSlide}
              initial="hidden"
              animate="visible"
              exit="exit"
              className={cn(
                'glass-strong pointer-events-auto flex items-start gap-2.5 rounded-lg px-4 py-3 text-sm shadow-float sm:w-auto sm:max-w-sm',
              )}
            >
              {t.variant === 'success' ? (
                <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-success" aria-hidden />
              ) : (
                <XCircle className="mt-0.5 size-4 shrink-0 text-danger" aria-hidden />
              )}
              <span className="flex-1 text-ink">{t.message}</span>
              <button
                onClick={() => dismiss(t.id)}
                aria-label="ปิดการแจ้งเตือน"
                className="text-ink-subtle hover:text-ink"
              >
                <X className="size-4" aria-hidden />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast ต้องถูกเรียกภายใน ToastProvider');
  return ctx;
}
