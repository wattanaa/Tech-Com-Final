import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Mail, MailOpen, Trash2 } from 'lucide-react';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { SearchInput } from '@/components/ui/SearchInput';
import { Pagination } from '@/components/ui/Pagination';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { DataTable, type DataTableColumn } from '@/components/admin/resource/DataTable';
import { Modal } from '@/components/admin/Modal';
import { useToast } from '@/components/admin/Toast';
import { useConfirm } from '@/components/admin/ConfirmDialog';
import { useDebounce } from '@/hooks/useDebounce';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { ApiClientError } from '@/api/client';
import { listMessages, markMessageRead, removeMessage, type ContactMessageRow } from '@/api/admin/messages';

const QUERY_KEY = ['admin', 'messages'] as const;

export function MessagesPage() {
  useDocumentTitle('ข้อความติดต่อ');
  const toast = useToast();
  const confirm = useConfirm();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [unreadOnly, setUnreadOnly] = useState(false);
  const debouncedSearch = useDebounce(search);
  const [viewing, setViewing] = useState<ContactMessageRow | null>(null);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: [...QUERY_KEY, page, debouncedSearch, unreadOnly],
    queryFn: () => listMessages({ page, search: debouncedSearch || undefined, status: unreadOnly ? 'unread' : undefined }),
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: QUERY_KEY });
  const readMutation = useMutation({ mutationFn: markMessageRead, onSuccess: invalidate });
  const removeMutation = useMutation({ mutationFn: removeMessage, onSuccess: invalidate });

  const handleView = async (row: ContactMessageRow) => {
    setViewing(row);
    if (!row.isRead) {
      try {
        await readMutation.mutateAsync(row.id);
      } catch {
        /* ไม่ต้องแจ้งผู้ใช้ — แค่ทำเครื่องหมายอ่านแล้วเงียบ ๆ พอ */
      }
    }
  };

  const handleDelete = async (row: ContactMessageRow) => {
    const ok = await confirm({ title: `ลบข้อความจาก "${row.name}" ?`, danger: true, confirmLabel: 'ลบ' });
    if (!ok) return;
    try {
      await removeMutation.mutateAsync(row.id);
      toast.success('ลบข้อความสำเร็จ');
      setViewing(null);
    } catch (err) {
      toast.error(err instanceof ApiClientError ? err.message : 'ลบไม่สำเร็จ');
    }
  };

  const columns: DataTableColumn<ContactMessageRow>[] = [
    {
      header: '',
      cell: (row) =>
        row.isRead ? (
          <MailOpen className="size-4 text-ink-subtle" aria-hidden />
        ) : (
          <Mail className="size-4 text-brand-500" aria-hidden />
        ),
      className: 'w-8',
    },
    { header: 'ชื่อ', cell: (row) => (row.isRead ? row.name : <strong>{row.name}</strong>) },
    { header: 'หัวข้อ', cell: (row) => row.subject },
    { header: 'อีเมล', cell: (row) => row.email },
    {
      header: 'เมื่อ',
      cell: (row) => new Date(row.createdAt).toLocaleString('th-TH', { dateStyle: 'short', timeStyle: 'short' }),
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      <SectionHeader
        title="ข้อความติดต่อ"
        description={data ? `ยังไม่อ่าน ${data.unread} ข้อความ` : undefined}
      />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <SearchInput
          value={search}
          onChange={(v) => {
            setSearch(v);
            setPage(1);
          }}
          placeholder="ค้นหาชื่อ หัวข้อ…"
          className="sm:max-w-xs"
        />
        <Button
          size="sm"
          variant={unreadOnly ? 'primary' : 'outline'}
          onClick={() => {
            setUnreadOnly((v) => !v);
            setPage(1);
          }}
        >
          {unreadOnly ? 'แสดงทั้งหมด' : 'เฉพาะยังไม่อ่าน'}
        </Button>
      </div>

      <DataTable
        columns={columns}
        items={data?.items ?? []}
        getRowId={(row) => row.id}
        isLoading={isLoading}
        isError={isError}
        onRetry={() => refetch()}
        emptyMessage="ยังไม่มีข้อความติดต่อ"
        rowActions={(row) => (
          <>
            <Button variant="ghost" size="xs" onClick={() => handleView(row)} aria-label={`ดูข้อความจาก ${row.name}`}>
              <MailOpen className="size-4" aria-hidden />
            </Button>
            <Button variant="ghost" size="xs" onClick={() => handleDelete(row)} aria-label={`ลบข้อความจาก ${row.name}`}>
              <Trash2 className="size-4 text-danger" aria-hidden />
            </Button>
          </>
        )}
      />

      {data?.meta && <Pagination page={data.meta.page} totalPages={data.meta.totalPages} onChange={setPage} />}

      <Modal open={viewing !== null} onClose={() => setViewing(null)} title={viewing?.subject ?? ''}>
        {viewing && (
          <div className="flex flex-col gap-3 text-sm">
            <div className="flex flex-wrap items-center gap-2 text-ink-muted">
              <span className="font-medium text-ink">{viewing.name}</span>
              <span>·</span>
              <a href={`mailto:${viewing.email}`} className="text-brand-500 hover:underline">
                {viewing.email}
              </a>
              {viewing.phone && (
                <>
                  <span>·</span>
                  <span>{viewing.phone}</span>
                </>
              )}
              {!viewing.isRead && <Badge>ใหม่</Badge>}
            </div>
            <p className="whitespace-pre-wrap rounded-sm border border-hairline/15 bg-surface/60 p-4 text-ink">
              {viewing.message}
            </p>
            <div className="flex justify-end">
              <Button variant="danger" size="sm" leftIcon={<Trash2 className="size-4" aria-hidden />} onClick={() => handleDelete(viewing)}>
                ลบข้อความนี้
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
