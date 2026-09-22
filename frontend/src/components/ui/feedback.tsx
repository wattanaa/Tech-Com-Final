import type { ReactNode } from 'react';
import { Loader2, Inbox, TriangleAlert, RotateCw } from 'lucide-react';
import { cn } from '@/utils/cn';
import { Button } from './Button';
import { GlassCard } from './GlassCard';

/** โครงร่างระหว่างโหลดข้อมูล */
export function Skeleton({ className }: { className?: string }) {
  return <div className={cn('skeleton', className)} />;
}

/** การ์ดโครงร่างสำหรับ grid ระหว่างโหลด */
export function SkeletonCard() {
  return (
    <div className="glass overflow-hidden rounded-lg">
      <Skeleton className="h-40 w-full rounded-none" />
      <div className="flex flex-col gap-2.5 p-4">
        <Skeleton className="h-3 w-20" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-2/3" />
      </div>
    </div>
  );
}

export function SkeletonGrid({ count = 6, cols = 3 }: { count?: number; cols?: number }) {
  return (
    <div
      className="grid gap-5"
      style={{ gridTemplateColumns: `repeat(auto-fill, minmax(min(100%, ${100 / cols - 2}%), 1fr))` }}
      aria-busy="true"
      aria-live="polite"
    >
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
      <span className="sr-only">กำลังโหลดข้อมูล</span>
    </div>
  );
}

/** โครงร่างหน้ารายละเอียด — ภาพปก + ข้อความหลายบรรทัด ใช้แทน Spinner กันหน้าจอกระโดดตอนโหลดเสร็จ */
export function DetailSkeleton({ sidebar = false }: { sidebar?: boolean }) {
  return (
    <div className={cn('mx-auto max-w-3xl px-4 py-12', sidebar && 'max-w-5xl')} aria-busy="true" aria-live="polite">
      <div className={cn(sidebar && 'grid gap-8 lg:grid-cols-[1fr_320px]')}>
        <div className="flex flex-col gap-4">
          <Skeleton className="aspect-[16/9] w-full rounded-lg" />
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-7 w-3/4" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-2/3" />
        </div>
        {sidebar && (
          <div className="mt-6 lg:mt-0">
            <GlassCard padding="lg" className="flex flex-col gap-3">
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-2/3" />
            </GlassCard>
          </div>
        )}
      </div>
      <span className="sr-only">กำลังโหลดข้อมูล</span>
    </div>
  );
}

/** โครงร่างรายการแบบแถวเรียบ (ไม่มีรูป) — ใช้กับผลการค้นหา */
export function SkeletonList({ count = 5 }: { count?: number }) {
  return (
    <div className="flex flex-col gap-3" aria-busy="true" aria-live="polite">
      {Array.from({ length: count }).map((_, i) => (
        <GlassCard key={i} padding="md" className="flex flex-col gap-2">
          <Skeleton className="h-4 w-1/3" />
          <Skeleton className="h-3 w-2/3" />
        </GlassCard>
      ))}
      <span className="sr-only">กำลังโหลดข้อมูล</span>
    </div>
  );
}

export function Spinner({ label = 'กำลังโหลด' }: { label?: string }) {
  return (
    <div className="flex items-center justify-center gap-2.5 py-16 text-ink-muted" role="status">
      <Loader2 className="size-5 animate-spin text-brand-500" aria-hidden />
      <span className="text-sm">{label}</span>
    </div>
  );
}

export function EmptyState({
  title = 'ยังไม่มีข้อมูล',
  message,
  icon,
}: {
  title?: string;
  message?: string;
  icon?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center gap-3 py-16 text-center">
      <div className="grid size-14 place-items-center rounded-full bg-brand-500/[0.10] text-brand-500">
        {icon ?? <Inbox className="size-6" aria-hidden />}
      </div>
      <p className="font-display text-base font-semibold">{title}</p>
      {message && <p className="max-w-sm text-sm text-ink-muted">{message}</p>}
    </div>
  );
}

export function ErrorState({ onRetry, message }: { onRetry?: () => void; message?: string }) {
  return (
    <div className="flex flex-col items-center gap-3 py-16 text-center" role="alert">
      <div className="grid size-14 place-items-center rounded-full bg-warning/[0.12] text-warning">
        <TriangleAlert className="size-6" aria-hidden />
      </div>
      <p className="font-display text-base font-semibold">โหลดข้อมูลไม่สำเร็จ</p>
      <p className="max-w-sm text-sm text-ink-muted">
        {message ?? 'เกิดข้อผิดพลาดในการเชื่อมต่อ กรุณาลองใหม่อีกครั้ง'}
      </p>
      {onRetry && (
        <Button variant="outline" size="sm" onClick={onRetry} leftIcon={<RotateCw className="size-4" aria-hidden />}>
          ลองอีกครั้ง
        </Button>
      )}
    </div>
  );
}
