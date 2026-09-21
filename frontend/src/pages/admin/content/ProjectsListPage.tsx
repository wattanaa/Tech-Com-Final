import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Pencil, Plus, Trash2, Trophy } from 'lucide-react';
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
import type { AdminProject } from '@/types/adminContent';

export function ProjectsListPage() {
  useDocumentTitle('ผลงานนักศึกษา');
  const toast = useToast();
  const confirm = useConfirm();
  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState('');
  const search = useDebounce(searchInput);

  const { useList, useRemove } = useResourceAdmin<AdminProject, never>('projects');
  const list = useList({ page, search: search || undefined });
  const removeMutation = useRemove();

  const items = list.data?.items ?? [];
  const meta = list.data?.meta;

  const columns: DataTableColumn<AdminProject>[] = [
    { header: 'ชื่อผลงาน', cell: (p) => p.name },
    { header: 'ปีการศึกษา', cell: (p) => p.year },
    {
      header: 'รางวัล',
      cell: (p) =>
        p.award ? (
          <span className="inline-flex items-center gap-1 text-warning">
            <Trophy className="size-3.5" aria-hidden /> {p.award}
          </span>
        ) : (
          '—'
        ),
    },
    { header: 'หมวดหมู่', cell: (p) => (p.category ? <Badge color={p.category.color}>{p.category.name}</Badge> : '—') },
    { header: 'สถานะ', cell: (p) => <Badge color={STATUS_COLOR[p.status]}>{STATUS_LABEL[p.status]}</Badge> },
  ];

  const handleDelete = async (item: AdminProject) => {
    const ok = await confirm({ title: `ลบผลงาน "${item.name}" ?`, danger: true, confirmLabel: 'ลบ' });
    if (!ok) return;
    try {
      await removeMutation.mutateAsync(item.id);
      toast.success('ลบผลงานสำเร็จ');
    } catch (err) {
      toast.error(err instanceof ApiClientError ? err.message : 'ลบไม่สำเร็จ กรุณาลองใหม่อีกครั้ง');
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <SectionHeader
        title="ผลงานนักศึกษา"
        description="จัดการผลงาน สิ่งประดิษฐ์ และโครงงานของนักศึกษา"
        action={
          <Link to="/admin/projects/new">
            <Button size="sm" leftIcon={<Plus className="size-4" aria-hidden />}>
              เพิ่มผลงาน
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
        placeholder="ค้นหาชื่อผลงาน…"
        className="sm:max-w-xs"
      />

      <DataTable
        columns={columns}
        items={items}
        getRowId={(p) => p.id}
        isLoading={list.isLoading}
        isError={list.isError}
        onRetry={() => list.refetch()}
        emptyMessage="ยังไม่มีผลงาน"
        rowActions={(p) => (
          <>
            <Link to={`/admin/projects/${p.id}`}>
              <Button variant="ghost" size="xs" aria-label={`แก้ไข ${p.name}`}>
                <Pencil className="size-4" aria-hidden />
              </Button>
            </Link>
            <Button variant="ghost" size="xs" onClick={() => handleDelete(p)} aria-label={`ลบ ${p.name}`}>
              <Trash2 className="size-4 text-danger" aria-hidden />
            </Button>
          </>
        )}
      />

      {meta && <Pagination page={meta.page} totalPages={meta.totalPages} onChange={setPage} />}
    </div>
  );
}
