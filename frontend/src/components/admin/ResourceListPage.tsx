import { useState, type ReactNode } from 'react';
import type { DefaultValues, FieldValues } from 'react-hook-form';
import type { ZodType } from 'zod';
import type { UseMutationResult, UseQueryResult } from '@tanstack/react-query';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { SearchInput } from '@/components/ui/SearchInput';
import { Pagination } from '@/components/ui/Pagination';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { DataTable, type DataTableColumn } from './resource/DataTable';
import { ResourceForm, type ResourceFormField } from './resource/ResourceForm';
import { Modal } from './Modal';
import { useToast } from './Toast';
import { useConfirm } from './ConfirmDialog';
import { useDebounce } from '@/hooks/useDebounce';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { ApiClientError } from '@/api/client';
import type { ListParams } from '@/api/admin/resource';
import type { Paginated } from '@/types';

interface ResourceRow {
  id: string;
  updatedAt?: string;
}

interface ResourceListPageProps<TItem extends ResourceRow, TInput extends FieldValues> {
  title: string;
  description?: string;
  createLabel?: string;
  searchPlaceholder?: string;
  emptyMessage?: string;
  columns: DataTableColumn<TItem>[];
  /** ฟังก์ชันรับ item ปัจจุบัน (undefined ตอนสร้างใหม่) — ใช้เมื่อฟิลด์บางตัวต้องพึ่งข้อมูลเดิม เช่น initialPreview ของรูปภาพ */
  formFields: ResourceFormField[] | ((item: TItem | undefined) => ResourceFormField[]);
  /** ฟังก์ชันรับ item ปัจจุบันได้เช่นกัน — ใช้เมื่อ schema ต้องต่างกันระหว่างสร้างใหม่กับแก้ไข เช่น รหัสผ่านที่บังคับตอนสร้างแต่ไม่บังคับตอนแก้ */
  formSchema: ZodType<TInput> | ((item: TItem | undefined) => ZodType<TInput>);
  toFormDefaults: (item?: TItem) => Partial<TInput>;
  useList: (params: ListParams) => UseQueryResult<Paginated<TItem>>;
  useCreate: () => UseMutationResult<TItem, unknown, TInput>;
  useUpdate: () => UseMutationResult<TItem, unknown, { id: string; data: Partial<TInput> & { updatedAt?: string } }>;
  useRemove: () => UseMutationResult<void, unknown, string>;
  getItemLabel: (item: TItem) => string;
  deleteWarning?: string;
  /** ช่องกรองเพิ่มเติมข้าง search — เช่น dropdown ประเภท */
  extraToolbar?: ReactNode;
}

/**
 * หน้ารายการ + ฟอร์มสร้าง/แก้ไข ที่ใช้ซ้ำได้กับทุก entity ที่ผูกกับ generic resource
 * router ของ backend — แต่ละหน้าประกาศแค่คอลัมน์/ฟิลด์ฟอร์ม/hook ข้อมูลของตัวเอง
 */
export function ResourceListPage<TItem extends ResourceRow, TInput extends FieldValues>({
  title,
  description,
  createLabel = 'เพิ่มใหม่',
  searchPlaceholder,
  emptyMessage,
  columns,
  formFields,
  formSchema,
  toFormDefaults,
  useList,
  useCreate,
  useUpdate,
  useRemove,
  getItemLabel,
  deleteWarning,
  extraToolbar,
}: ResourceListPageProps<TItem, TInput>) {
  useDocumentTitle(title);
  const toast = useToast();
  const confirm = useConfirm();

  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState('');
  const search = useDebounce(searchInput);
  const [modalItem, setModalItem] = useState<TItem | 'new' | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const list = useList({ page, search: search || undefined });
  const createMutation = useCreate();
  const updateMutation = useUpdate();
  const removeMutation = useRemove();

  const items = list.data?.items ?? [];
  const meta = list.data?.meta;

  const closeModal = () => {
    setModalItem(null);
    setFormError(null);
  };

  const handleSubmit = async (values: TInput) => {
    setFormError(null);
    try {
      if (modalItem === 'new') {
        await createMutation.mutateAsync(values);
        toast.success('เพิ่มข้อมูลสำเร็จ');
      } else if (modalItem) {
        await updateMutation.mutateAsync({ id: modalItem.id, data: { ...values, updatedAt: modalItem.updatedAt } });
        toast.success('บันทึกการแก้ไขสำเร็จ');
      }
      closeModal();
    } catch (err) {
      setFormError(err instanceof ApiClientError ? err.message : 'บันทึกไม่สำเร็จ กรุณาลองใหม่อีกครั้ง');
    }
  };

  const handleDelete = async (item: TItem) => {
    const ok = await confirm({
      title: `ลบ "${getItemLabel(item)}" ?`,
      message: deleteWarning ?? 'ไม่สามารถย้อนกลับการลบนี้ได้',
      danger: true,
      confirmLabel: 'ลบ',
    });
    if (!ok) return;
    try {
      await removeMutation.mutateAsync(item.id);
      toast.success('ลบข้อมูลสำเร็จ');
    } catch (err) {
      toast.error(err instanceof ApiClientError ? err.message : 'ลบไม่สำเร็จ กรุณาลองใหม่อีกครั้ง');
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <SectionHeader
        title={title}
        description={description}
        action={
          <Button size="sm" leftIcon={<Plus className="size-4" aria-hidden />} onClick={() => setModalItem('new')}>
            {createLabel}
          </Button>
        }
      />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <SearchInput
          value={searchInput}
          onChange={(v) => {
            setSearchInput(v);
            setPage(1);
          }}
          placeholder={searchPlaceholder ?? 'ค้นหา…'}
          className="sm:max-w-xs"
        />
        {extraToolbar}
      </div>

      <DataTable
        columns={columns}
        items={items}
        getRowId={(item) => item.id}
        isLoading={list.isLoading}
        isError={list.isError}
        onRetry={() => list.refetch()}
        emptyMessage={emptyMessage}
        rowActions={(item) => (
          <>
            <Button variant="ghost" size="xs" onClick={() => setModalItem(item)} aria-label={`แก้ไข ${getItemLabel(item)}`}>
              <Pencil className="size-4" aria-hidden />
            </Button>
            <Button variant="ghost" size="xs" onClick={() => handleDelete(item)} aria-label={`ลบ ${getItemLabel(item)}`}>
              <Trash2 className="size-4 text-danger" aria-hidden />
            </Button>
          </>
        )}
      />

      {meta && <Pagination page={meta.page} totalPages={meta.totalPages} onChange={setPage} />}

      <Modal
        open={modalItem !== null}
        onClose={closeModal}
        title={modalItem === 'new' ? createLabel : `แก้ไข${title}`}
      >
        <ResourceForm
          fields={typeof formFields === 'function' ? formFields(modalItem === 'new' ? undefined : (modalItem ?? undefined)) : formFields}
          schema={typeof formSchema === 'function' ? formSchema(modalItem === 'new' ? undefined : (modalItem ?? undefined)) : formSchema}
          defaultValues={toFormDefaults(modalItem === 'new' ? undefined : (modalItem ?? undefined)) as DefaultValues<TInput>}
          onSubmit={handleSubmit}
          onCancel={closeModal}
          submitError={formError}
        />
      </Modal>
    </div>
  );
}
