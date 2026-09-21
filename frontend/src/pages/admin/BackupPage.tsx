import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { DatabaseBackup, RotateCcw, Trash2 } from 'lucide-react';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { DataTable, type DataTableColumn } from '@/components/admin/resource/DataTable';
import { useToast } from '@/components/admin/Toast';
import { useConfirm } from '@/components/admin/ConfirmDialog';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { ApiClientError } from '@/api/client';
import { createBackup, listBackups, removeBackup, restoreBackup, type BackupRow, type BackupStatus } from '@/api/admin/backup';

const STATUS_LABEL: Record<BackupStatus, string> = {
  PENDING: 'รอดำเนินการ',
  RUNNING: 'กำลังสำรองข้อมูล',
  SUCCESS: 'สำเร็จ',
  FAILED: 'ล้มเหลว',
};
const STATUS_COLOR: Record<BackupStatus, string> = {
  PENDING: '#94a3b8',
  RUNNING: '#f59e0b',
  SUCCESS: '#16a34a',
  FAILED: '#DC2626',
};

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  const units = ['KB', 'MB', 'GB'];
  let size = bytes / 1024;
  let i = 0;
  while (size >= 1024 && i < units.length - 1) {
    size /= 1024;
    i += 1;
  }
  return `${size.toFixed(1)} ${units[i]}`;
}

const QUERY_KEY = ['admin', 'backups'] as const;

export function BackupPage() {
  useDocumentTitle('สำรองข้อมูล');
  const toast = useToast();
  const confirm = useConfirm();
  const queryClient = useQueryClient();

  const { data, isLoading, isError, refetch } = useQuery({ queryKey: QUERY_KEY, queryFn: listBackups });
  const invalidate = () => queryClient.invalidateQueries({ queryKey: QUERY_KEY });

  const createMutation = useMutation({ mutationFn: createBackup, onSuccess: invalidate });
  const restoreMutation = useMutation({ mutationFn: restoreBackup, onSuccess: invalidate });
  const removeMutation = useMutation({ mutationFn: removeBackup, onSuccess: invalidate });

  const handleCreate = async () => {
    try {
      const result = await createMutation.mutateAsync();
      toast.success(result.message);
    } catch (err) {
      toast.error(err instanceof ApiClientError ? err.message : 'สั่งสำรองข้อมูลไม่สำเร็จ');
    }
  };

  const handleRestore = async (backup: BackupRow) => {
    const ok = await confirm({
      title: `กู้คืนข้อมูลจาก "${backup.filename}" ?`,
      message: 'การกู้คืนจะเขียนทับข้อมูลปัจจุบันทั้งหมดในระบบ ไม่สามารถย้อนกลับได้ กรุณาตรวจสอบให้แน่ใจก่อนดำเนินการ',
      danger: true,
      confirmLabel: 'กู้คืนข้อมูล',
    });
    if (!ok) return;
    try {
      const result = await restoreMutation.mutateAsync(backup.id);
      toast.success(result.message);
    } catch (err) {
      toast.error(err instanceof ApiClientError ? err.message : 'กู้คืนไม่สำเร็จ');
    }
  };

  const handleDelete = async (backup: BackupRow) => {
    const ok = await confirm({ title: `ลบไฟล์สำรอง "${backup.filename}" ?`, danger: true, confirmLabel: 'ลบ' });
    if (!ok) return;
    try {
      await removeMutation.mutateAsync(backup.id);
      toast.success('ลบไฟล์สำรองสำเร็จ');
    } catch (err) {
      toast.error(err instanceof ApiClientError ? err.message : 'ลบไม่สำเร็จ');
    }
  };

  const columns: DataTableColumn<BackupRow>[] = [
    { header: 'ไฟล์', cell: (b) => b.filename },
    { header: 'ขนาด', cell: (b) => formatSize(b.size) },
    { header: 'สถานะ', cell: (b) => <Badge color={STATUS_COLOR[b.status]}>{STATUS_LABEL[b.status]}</Badge> },
    { header: 'โดย', cell: (b) => b.createdBy?.name ?? '—' },
    { header: 'เมื่อ', cell: (b) => new Date(b.createdAt).toLocaleString('th-TH', { dateStyle: 'short', timeStyle: 'short' }) },
  ];

  return (
    <div className="flex flex-col gap-6">
      <SectionHeader
        title="สำรองข้อมูล"
        description="สำรองและกู้คืนฐานข้อมูลของระบบ — เฉพาะผู้ดูแลระบบสูงสุด"
        action={
          <Button
            size="sm"
            isLoading={createMutation.isPending}
            leftIcon={<DatabaseBackup className="size-4" aria-hidden />}
            onClick={handleCreate}
          >
            สำรองข้อมูลตอนนี้
          </Button>
        }
      />

      <DataTable
        columns={columns}
        items={data ?? []}
        getRowId={(b) => b.id}
        isLoading={isLoading}
        isError={isError}
        onRetry={() => refetch()}
        emptyMessage="ยังไม่มีไฟล์สำรองข้อมูล"
        rowActions={(b) => (
          <>
            <Button
              variant="ghost"
              size="xs"
              disabled={b.status !== 'SUCCESS'}
              onClick={() => handleRestore(b)}
              aria-label={`กู้คืนจาก ${b.filename}`}
            >
              <RotateCcw className="size-4" aria-hidden />
            </Button>
            <Button variant="ghost" size="xs" onClick={() => handleDelete(b)} aria-label={`ลบ ${b.filename}`}>
              <Trash2 className="size-4 text-danger" aria-hidden />
            </Button>
          </>
        )}
      />
    </div>
  );
}
