import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { SearchInput } from '@/components/ui/SearchInput';
import { Pagination } from '@/components/ui/Pagination';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { DataTable, type DataTableColumn } from '@/components/admin/resource/DataTable';
import { useToast } from '@/components/admin/Toast';
import { useConfirm } from '@/components/admin/ConfirmDialog';
import { useResourceAdmin } from '@/hooks/admin/useResourceAdmin';
import { useDebounce } from '@/hooks/useDebounce';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { ApiClientError } from '@/api/client';
import { STATUS_COLOR, STATUS_LABEL } from '@/config/workflow';
import type { AdminActivity } from '@/types/adminContent';

export function ActivitiesListPage() {
  useDocumentTitle('กิจกรรม');
  const toast = useToast();
  const confirm = useConfirm();
  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState('');
  const search = useDebounce(searchInput);

  const { useList, useRemove } = useResourceAdmin<AdminActivity, never>('activities');
  const list = useList({ page, search: search || undefined });
  const removeMutation = useRemove();

  const items = list.data?.items ?? [];
  const meta = list.data?.meta;

  const columns: DataTableColumn<AdminActivity>[] = [
    { header: 'ชื่อกิจกรรม', cell: (a) => a.title },
    { header: 'วันที่จัด', cell: (a) => new Date(a.startDate).toLocaleDateString('th-TH') },
    { header: 'สถานที่', cell: (a) => a.location ?? '—' },
    { header: 'หมวดหมู่', cell: (a) => (a.category ? <Badge color={a.category.color}>{a.category.name}</Badge> : '—') },
    { header: 'สถานะ', cell: (a) => <Badge color={STATUS_COLOR[a.status]}>{STATUS_LABEL[a.status]}</Badge> },
  ];

  const handleDelete = async (item: AdminActivity) => {
    const ok = await confirm({ title: `ลบกิจกรรม "${item.title}" ?`, danger: true, confirmLabel: 'ลบ' });
    if (!ok) return;
    try {
      await removeMutation.mutateAsync(item.id);
      toast.success('ลบกิจกรรมสำเร็จ');
    } catch (err) {
      toast.error(err instanceof ApiClientError ? err.message : 'ลบไม่สำเร็จ กรุณาลองใหม่อีกครั้ง');
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <SectionHeader
        title="กิจกรรม"
        description="จัดการกิจกรรมของแผนก"
        action={
          <Link to="/admin/activities/new">
            <Button size="sm" leftIcon={<Plus className="size-4" aria-hidden />}>
              เพิ่มกิจกรรม
            </Button>
          </Link>
        }
      />

      <SearchInput
        value={searchInput}
        onChange={(v) => {
          setSearchInput(v);
          setPage(1);
        }}
        placeholder="ค้นหาชื่อกิจกรรม…"
        className="sm:max-w-xs"
      />

      <DataTable
        columns={columns}
        items={items}
        getRowId={(a) => a.id}
        isLoading={list.isLoading}
        isError={list.isError}
        onRetry={() => list.refetch()}
        emptyMessage="ยังไม่มีกิจกรรม"
        rowActions={(a) => (
          <>
            <Link to={`/admin/activities/${a.id}`}>
              <Button variant="ghost" size="xs" aria-label={`แก้ไข ${a.title}`}>
                <Pencil className="size-4" aria-hidden />
              </Button>
            </Link>
            <Button variant="ghost" size="xs" onClick={() => handleDelete(a)} aria-label={`ลบ ${a.title}`}>
              <Trash2 className="size-4 text-danger" aria-hidden />
            </Button>
          </>
        )}
      />

      {meta && <Pagination page={meta.page} totalPages={meta.totalPages} onChange={setPage} />}
    </div>
  );
}
