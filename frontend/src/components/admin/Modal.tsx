import type { ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { GlassCard } from '@/components/ui/GlassCard';

const WIDTHS = { sm: 'max-w-sm', md: 'max-w-lg', lg: 'max-w-2xl', xl: 'max-w-4xl' } as const;

/** กล่องโต้ตอบกลาง — ใช้กับฟอร์มสร้าง/แก้ไขและตัวเลือกสื่อทุกที่ในหลังบ้าน */
export function Modal({
  open,
  onClose,
  title,
  children,
  size = 'md',
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  size?: keyof typeof WIDTHS;
}) {
  if (!open) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[105] grid place-items-start overflow-y-auto bg-black/50 p-4 py-10 sm:place-items-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <GlassCard variant="strong" padding="lg" className={`w-full ${WIDTHS[size]}`}>
        <div className="mb-5 flex items-center justify-between">
          <p id="modal-title" className="font-display text-base font-semibold text-ink">
            {title}
          </p>
          <button onClick={onClose} aria-label="ปิด" className="text-ink-subtle hover:text-ink">
            <X className="size-5" aria-hidden />
          </button>
        </div>
        {children}
      </GlassCard>
    </div>,
    document.body,
  );
}
