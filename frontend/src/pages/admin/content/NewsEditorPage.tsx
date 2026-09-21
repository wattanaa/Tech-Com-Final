import { useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { z } from 'zod';
import { GlassCard } from '@/components/ui/GlassCard';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { Spinner } from '@/components/ui/feedback';
import { ResourceForm, type ResourceFormField } from '@/components/admin/resource/ResourceForm';
import { StatusWorkflowControl } from '@/components/admin/resource/StatusWorkflowControl';
import { VersionHistoryPanel } from '@/components/admin/resource/VersionHistoryPanel';
import { useToast } from '@/components/admin/Toast';
import { useResourceAdmin } from '@/hooks/admin/useResourceAdmin';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { ApiClientError } from '@/api/client';
import type { AdminCategory, AdminNews } from '@/types/adminContent';

const newsSchema = z.object({
  title: z.string().trim().min(5, 'กรุณากรอกหัวข้อข่าว').max(250),
  excerpt: z.string().trim().min(10, 'กรุณากรอกสรุปย่อ').max(500),
  content: z.string().trim().min(20, 'กรุณากรอกเนื้อหาข่าว').max(50_000),
  categoryId: z.string().optional().or(z.literal('')),
  isPinned: z.boolean(),
  coverImageId: z.string().optional().or(z.literal('')),
});
type NewsInput = z.infer<typeof newsSchema>;

export function NewsEditorPage() {
  const { id } = useParams<{ id: string }>();
  const isNew = !id || id === 'new';
  const navigate = useNavigate();
  const toast = useToast();
  const [formError, setFormError] = useState<string | null>(null);

  const { useItem, useCreate, useUpdate, useChangeStatus, useVersions, useRestoreVersion } = useResourceAdmin<
    AdminNews,
    NewsInput
  >('news');
  const categoriesAdmin = useResourceAdmin<AdminCategory, never>('categories');
  const categoriesQuery = categoriesAdmin.useList({ limit: 100, type: 'NEWS' });

  const itemQuery = useItem(isNew ? undefined : id);
  const createMutation = useCreate();
  const updateMutation = useUpdate();
  const changeStatusMutation = useChangeStatus();
  const versionsQuery = useVersions(isNew ? undefined : id);
  const restoreVersionMutation = useRestoreVersion(id ?? '');

  useDocumentTitle(isNew ? 'เพิ่มข่าว' : (itemQuery.data?.title ?? 'แก้ไขข่าว'));

  const formFields = useMemo<ResourceFormField[]>(() => {
    const categoryOptions = (categoriesQuery.data?.items ?? []).map((c) => ({ value: c.id, label: c.name }));
    return [
      { name: 'coverImageId', label: 'ภาพหน้าปกข่าว', type: 'image', initialPreview: itemQuery.data?.coverImage },
      { name: 'title', label: 'หัวข้อข่าว', type: 'text', colSpan: 2 },
      { name: 'categoryId', label: 'หมวดหมู่', type: 'select', options: categoryOptions },
      { name: 'isPinned', label: 'ปักหมุดข่าวนี้ไว้บนสุด', type: 'checkbox' },
      { name: 'excerpt', label: 'สรุปย่อ', type: 'textarea', colSpan: 2, rows: 2 },
      { name: 'content', label: 'เนื้อหาข่าว', type: 'textarea', colSpan: 2, rows: 12 },
    ];
  }, [categoriesQuery.data, itemQuery.data]);

  if (!isNew && itemQuery.isLoading) {
    return (
      <GlassCard padding="lg">
        <Spinner />
      </GlassCard>
    );
  }

  const item = itemQuery.data;

  const handleSubmit = async (values: NewsInput) => {
    setFormError(null);
    const payload = { ...values, categoryId: values.categoryId || undefined };
    try {
      if (isNew) {
        await createMutation.mutateAsync(payload);
        toast.success('เพิ่มข่าวสำเร็จ');
      } else {
        await updateMutation.mutateAsync({ id: id!, data: { ...payload, updatedAt: item?.updatedAt } });
        toast.success('บันทึกการแก้ไขสำเร็จ');
      }
      navigate('/admin/news');
    } catch (err) {
      setFormError(err instanceof ApiClientError ? err.message : 'บันทึกไม่สำเร็จ กรุณาลองใหม่อีกครั้ง');
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <SectionHeader title={isNew ? 'เพิ่มข่าว' : 'แก้ไขข่าว'} description={item?.title} />

      {!isNew && item && (
        <GlassCard padding="lg">
          <StatusWorkflowControl
            status={item.status}
            permissionGroup="news"
            isChanging={changeStatusMutation.isPending}
            onChange={(next) => changeStatusMutation.mutateAsync({ id: id!, status: next }).then(() => undefined)}
          />
        </GlassCard>
      )}

      <GlassCard padding="lg">
        <ResourceForm
          fields={formFields}
          schema={newsSchema}
          defaultValues={{
            title: item?.title ?? '',
            excerpt: item?.excerpt ?? '',
            content: item?.content ?? '',
            categoryId: item?.category?.id ?? '',
            isPinned: item?.isPinned ?? false,
            coverImageId: item?.coverImage?.id ?? '',
          }}
          onSubmit={handleSubmit}
          onCancel={() => navigate('/admin/news')}
          submitError={formError}
          submitLabel={isNew ? 'เพิ่มข่าว' : 'บันทึกการแก้ไข'}
        />
      </GlassCard>

      {!isNew && (
        <GlassCard padding="lg">
          <p className="mb-4 font-display text-sm font-semibold text-ink">ประวัติการแก้ไข</p>
          <VersionHistoryPanel
            versions={versionsQuery.data}
            isLoading={versionsQuery.isLoading}
            isRestoring={restoreVersionMutation.isPending}
            onRestore={(version) => restoreVersionMutation.mutateAsync(version).then(() => undefined)}
          />
        </GlassCard>
      )}
    </div>
  );
}
