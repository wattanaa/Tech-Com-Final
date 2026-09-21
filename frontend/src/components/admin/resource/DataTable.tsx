import type { ReactNode } from 'react';
import { GlassCard } from '@/components/ui/GlassCard';
import { EmptyState, ErrorState, Skeleton } from '@/components/ui/feedback';

export interface DataTableColumn<T> {
  header: string;
  cell: (item: T) => ReactNode;
  className?: string;
}

interface DataTableProps<T> {
  columns: DataTableColumn<T>[];
  items: T[];
  getRowId: (item: T) => string;
  isLoading: boolean;
  isError: boolean;
  onRetry: () => void;
  emptyMessage?: string;
  rowActions?: (item: T) => ReactNode;
}

/** ตารางกลางของทุกหน้ารายการหลังบ้าน — จัดการ loading/error/empty ให้เอง เหลือแค่ระบุคอลัมน์กับข้อมูล */
export function DataTable<T>({
  columns,
  items,
  getRowId,
  isLoading,
  isError,
  onRetry,
  emptyMessage,
  rowActions,
}: DataTableProps<T>) {
  if (isError) {
    return (
      <GlassCard padding="lg">
        <ErrorState onRetry={onRetry} />
      </GlassCard>
    );
  }

  if (isLoading) {
    return (
      <GlassCard padding="lg" className="flex flex-col gap-2.5">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-11 w-full" />
        ))}
      </GlassCard>
    );
  }

  if (items.length === 0) {
    return (
      <GlassCard padding="lg">
        <EmptyState message={emptyMessage} />
      </GlassCard>
    );
  }

  return (
    <GlassCard padding="none" className="overflow-x-auto">
      <table className="w-full min-w-[640px] border-collapse text-sm">
        <thead>
          <tr className="border-b border-hairline/15 text-left text-xs font-semibold uppercase tracking-wide text-ink-subtle">
            {columns.map((col) => (
              <th key={col.header} className={`px-4 py-3 font-semibold ${col.className ?? ''}`}>
                {col.header}
              </th>
            ))}
            {rowActions && <th className="px-4 py-3 text-right">จัดการ</th>}
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <tr key={getRowId(item)} className="border-b border-hairline/10 last:border-0 hover:bg-brand-500/[0.04]">
              {columns.map((col) => (
                <td key={col.header} className={`px-4 py-3 align-middle text-ink ${col.className ?? ''}`}>
                  {col.cell(item)}
                </td>
              ))}
              {rowActions && (
                <td className="px-4 py-3 text-right">
                  <div className="flex justify-end gap-2">{rowActions(item)}</div>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </GlassCard>
  );
}
