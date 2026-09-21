import { createContext, useCallback, useContext, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'motion/react';
import { TriangleAlert } from 'lucide-react';
import { GlassCard } from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/Button';
import { modalBackdrop, modalPanel } from '@/animations/variants';
import { useReducedMotion } from '@/hooks/useReducedMotion';

interface ConfirmOptions {
  title: string;
  message?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  /** true = ปุ่มยืนยันเป็นสีแดง ใช้กับการกระทำที่ทำลายข้อมูล (ลบ, กู้คืน) */
  danger?: boolean;
}

type ConfirmFn = (options: ConfirmOptions) => Promise<boolean>;

const ConfirmContext = createContext<ConfirmFn | null>(null);

interface PendingConfirm extends ConfirmOptions {
  resolve: (result: boolean) => void;
}

/** กล่องยืนยันก่อนทำรายการที่ย้อนกลับยาก — เรียกใช้ผ่าน useConfirm() แทน window.confirm ปกติ */
export function ConfirmProvider({ children }: { children: ReactNode }) {
  const [pending, setPending] = useState<PendingConfirm | null>(null);
  const reduced = useReducedMotion();

  const confirm = useCallback<ConfirmFn>((options) => {
    return new Promise((resolve) => setPending({ ...options, resolve }));
  }, []);

  const close = (result: boolean) => {
    pending?.resolve(result);
    setPending(null);
  };

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      {createPortal(
        <AnimatePresence>
          {pending && (
            <motion.div
              className="fixed inset-0 z-[110] grid place-items-center bg-black/50 p-4"
              role="dialog"
              aria-modal="true"
              aria-labelledby="confirm-dialog-title"
              variants={reduced ? undefined : modalBackdrop}
              initial="hidden"
              animate="visible"
              exit="exit"
            >
              <motion.div
                className="w-full max-w-sm"
                variants={reduced ? undefined : modalPanel}
                initial="hidden"
                animate="visible"
                exit="exit"
              >
                <GlassCard variant="strong" padding="lg">
                  <div className="flex items-start gap-3">
                    <div
                      className={
                        pending.danger
                          ? 'grid size-10 shrink-0 place-items-center rounded-full bg-danger/[0.12] text-danger'
                          : 'grid size-10 shrink-0 place-items-center rounded-full bg-brand-500/[0.10] text-brand-500'
                      }
                    >
                      <TriangleAlert className="size-5" aria-hidden />
                    </div>
                    <div className="flex-1">
                      <p id="confirm-dialog-title" className="font-display text-base font-semibold text-ink">
                        {pending.title}
                      </p>
                      {pending.message && <p className="mt-1 text-sm text-ink-muted">{pending.message}</p>}
                    </div>
                  </div>
                  <div className="mt-6 flex justify-end gap-2.5">
                    <Button variant="outline" size="sm" onClick={() => close(false)}>
                      {pending.cancelLabel ?? 'ยกเลิก'}
                    </Button>
                    <Button variant={pending.danger ? 'danger' : 'primary'} size="sm" onClick={() => close(true)}>
                      {pending.confirmLabel ?? 'ยืนยัน'}
                    </Button>
                  </div>
                </GlassCard>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>,
        document.body,
      )}
    </ConfirmContext.Provider>
  );
}

export function useConfirm(): ConfirmFn {
  const ctx = useContext(ConfirmContext);
  if (!ctx) throw new Error('useConfirm ต้องถูกเรียกภายใน ConfirmProvider');
  return ctx;
}
