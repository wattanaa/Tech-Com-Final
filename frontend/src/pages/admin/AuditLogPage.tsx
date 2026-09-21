import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { SearchInput } from '@/components/ui/SearchInput';
import { Pagination } from '@/components/ui/Pagination';
import { Badge } from '@/components/ui/Badge';
import { DataTable, type DataTableColumn } from '@/components/admin/resource/DataTable';
import { useDebounce } from '@/hooks/useDebounce';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { listAuditLogs, getAuditLogFilters, type AuditAction, type AuditLogRow } from '@/api/admin/audit';

const ACTION_LABEL: Record<AuditAction, string> = {
  CREATE: 'สร้าง',
  UPDATE: 'แก้ไข',
  DELETE: 'ลบ',
  LOGIN: 'เข้าสู่ระบบ',
  LOGOUT: 'ออกจากระบบ',
  PUBLISH: 'เผยแพร่',
  UNPUBLISH: 'ยกเลิกเผยแพร่',
  RESTORE: 'กู้คืน',
};

const ACTION_COLOR: Record<AuditAction, string> = {
  CREATE: '#16a34a',
  UPDATE: '#0ea5e9',
  DELETE: '#DC2626',
  LOGIN: '#64748b',
  LOGOUT: '#64748b',
  PUBLISH: '#16a34a',
  UNPUBLISH: '#f59e0b',
  RESTORE: '#8b5cf6',
};

const inputClass = 'glass rounded-sm px-3.5 py-2.5 text-sm text-ink outline-none focus:ring-2 focus:ring-brand-500';

export function AuditLogPage() {
  useDocumentTitle('บันทึกการใช้งาน');
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [action, setAction] = useState('');
  const [entity, setEntity] = useState('');
  const debouncedSearch = useDebounce(search);

  const filtersQuery = useQuery({ queryKey: ['admin', 'audit-logs', 'filters'], queryFn: getAuditLogFilters });
  const listQuery = useQuery({
    queryKey: ['admin', 'audit-logs', page, debouncedSearch, action, entity],
    queryFn: () =>
      listAuditLogs({
        page,
        search: debouncedSearch || undefined,
        type: (action || undefined) as AuditAction | undefined,
        status: entity || undefined,
      }),
  });

  const columns: DataTableColumn<AuditLogRow>[] = [
    {
      header: 'เวลา',
      cell: (row) => new Date(row.createdAt).toLocaleString('th-TH', { dateStyle: 'short', timeStyle: 'medium' }),
    },
    { header: 'ผู้ใช้งาน', cell: (row) => row.user?.name ?? 'ระบบ' },
    { header: 'การกระทำ', cell: (row) => <Badge color={ACTION_COLOR[row.action]}>{ACTION_LABEL[row.action]}</Badge> },
    { header: 'รายการ', cell: (row) => row.entity },
    { header: 'IP', cell: (row) => row.ipAddress ?? '—' },
  ];

  return (
    <div className="flex flex-col gap-6">
      <SectionHeader title="บันทึกการใช้งาน" description="ประวัติการกระทำทั้งหมดในระบบ — อ่านอย่างเดียว" />

      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
        <SearchInput
          value={search}
          onChange={(v) => {
            setSearch(v);
            setPage(1);
          }}
          placeholder="ค้นหารายการ ผู้ใช้…"
          className="sm:max-w-xs"
        />
        <select
          value={action}
          onChange={(e) => {
            setAction(e.target.value);
            setPage(1);
          }}
          className={inputClass}
        >
          <option value="">ทุกการกระทำ</option>
          {filtersQuery.data?.actions.map((a) => (
            <option key={a} value={a}>
              {ACTION_LABEL[a]}
            </option>
          ))}
        </select>
        <select
          value={entity}
          onChange={(e) => {
            setEntity(e.target.value);
            setPage(1);
          }}
          className={inputClass}
        >
          <option value="">ทุกรายการ</option>
          {filtersQuery.data?.entities.map((e) => (
            <option key={e.name} value={e.name}>
              {e.name} ({e.count})
            </option>
          ))}
        </select>
      </div>

      <DataTable
        columns={columns}
        items={listQuery.data?.items ?? []}
        getRowId={(row) => row.id}
        isLoading={listQuery.isLoading}
        isError={listQuery.isError}
        onRetry={() => listQuery.refetch()}
        emptyMessage="ไม่พบบันทึกการใช้งาน"
      />

      {listQuery.data?.meta && (
        <Pagination page={listQuery.data.meta.page} totalPages={listQuery.data.meta.totalPages} onChange={setPage} />
      )}
    </div>
  );
}
