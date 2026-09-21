import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Eye, Pencil, Pin, Plus, Trash2 } from 'lucide-react';
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
import type { AdminNews } from '@/types/adminContent';

export function NewsListPage() {
  useDocumentTitle('ข่าวประชาสัมพันธ์');
  const toast = useToast();
  const confirm = useConfirm();
  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState('');
  const search = useDebounce(searchInput);

  const { useList, useRemove } = useResourceAdmin<AdminNews, never>('news');
  const list = useList({ page, search: search || undefined });
  const removeMutation = useRemove();

  const items = list.data?.items ?? [];
  const meta = list.data?.meta;

  const columns: DataTableColumn<AdminNews>[] = [
    {
      header: 'หัวข้อข่าว',
      cell: (n) => (
        <span className="flex items-center gap-1.5">
          {n.isPinned && <Pin className="size-3.5 shrink-0 text-brand-500" aria-hidden />}
          {n.title}
        </span>
      ),
    },
    { header: 'หมวดหมู่', cell: (n) => (n.category ? <Badge color={n.category.color}>{n.category.name}</Badge> : '—') },
    { header: 'ผู้เขียน', cell: (n) => n.author?.name ?? '—' },
    {
      header: 'ยอดเข้าชม',
      cell: (n) => (
        <span className="inline-flex items-center gap-1 text-ink-muted">
          <Eye className="size-3.5" aria-hidden /> {n.views}
        </span>
      ),
    },
    { header: 'สถานะ', cell: (n) => <Badge color={STATUS_COLOR[n.status]}>{STATUS_LABEL[n.status]}</Badge> },
  ];

  const handleDelete = async (item: AdminNews) => {
    const ok = await confirm({ title: `ลบข่าว "${item.title}" ?`, danger: true, confirmLabel: 'ลบ' });
    if (!ok) return;
    try {
      await removeMutation.mutateAsync(item.id);
      toast.success('ลบข่าวสำเร็จ');
    } catch (err) {
      toast.error(err instanceof ApiClientError ? err.message : 'ลบไม่สำเร็จ กรุณาลองใหม่อีกครั้ง');
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <SectionHeader
        title="ข่าวประชาสัมพันธ์"
        description="จัดการข่าวสารและประกาศของแผนก"
        action={
          <Link to="/admin/news/new">
            <Button size="sm" leftIcon={<Plus className="size-4" aria-hidden />}>
              เพิ่มข่าว
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
        placeholder="ค้นหาหัวข้อข่าว…"
        className="sm:max-w-xs"
      />

      <DataTable
        columns={columns}
        items={items}
        getRowId={(n) => n.id}
        isLoading={list.isLoading}
        isError={list.isError}
        onRetry={() => list.refetch()}
        emptyMessage="ยังไม่มีข่าว"
        rowActions={(n) => (
          <>
            <Link to={`/admin/news/${n.id}`}>
              <Button variant="ghost" size="xs" aria-label={`แก้ไข ${n.title}`}>
                <Pencil className="size-4" aria-hidden />
              </Button>
            </Link>
            <Button variant="ghost" size="xs" onClick={() => handleDelete(n)} aria-label={`ลบ ${n.title}`}>
              <Trash2 className="size-4 text-danger" aria-hidden />
            </Button>
          </>
        )}
      />

      {meta && <Pagination page={meta.page} totalPages={meta.totalPages} onChange={setPage} />}
    </div>
  );
}
