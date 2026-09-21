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
import type { AdminActivity, AdminCategory } from '@/types/adminContent';

const activitySchema = z
  .object({
    title: z.string().trim().min(5, 'กรุณากรอกชื่อกิจกรรม').max(250),
    description: z.string().trim().min(10, 'กรุณากรอกรายละเอียดย่อ').max(500),
    content: z.string().trim().max(50_000).optional().or(z.literal('')),
    startDate: z.string().min(1, 'กรุณาระบุวันที่เริ่มกิจกรรม'),
    endDate: z.string().optional().or(z.literal('')),
    location: z.string().trim().max(250).optional().or(z.literal('')),
    categoryId: z.string().optional().or(z.literal('')),
    coverImageId: z.string().optional().or(z.literal('')),
  })
  .refine((v) => !v.endDate || v.endDate >= v.startDate, {
    message: 'วันที่สิ้นสุดต้องไม่มาก่อนวันที่เริ่ม',
    path: ['endDate'],
  });
type ActivityInput = z.infer<typeof activitySchema>;

export function ActivitiesEditorPage() {
  const { id } = useParams<{ id: string }>();
  const isNew = !id || id === 'new';
  const navigate = useNavigate();
  const toast = useToast();
  const [formError, setFormError] = useState<string | null>(null);

  const { useItem, useCreate, useUpdate, useChangeStatus, useVersions, useRestoreVersion } = useResourceAdmin<
    AdminActivity,
    ActivityInput
  >('activities');
  const categoriesAdmin = useResourceAdmin<AdminCategory, never>('categories');
  const categoriesQuery = categoriesAdmin.useList({ limit: 100, type: 'ACTIVITY' });

  const itemQuery = useItem(isNew ? undefined : id);
  const createMutation = useCreate();
  const updateMutation = useUpdate();
  const changeStatusMutation = useChangeStatus();
  const versionsQuery = useVersions(isNew ? undefined : id);
  const restoreVersionMutation = useRestoreVersion(id ?? '');

  useDocumentTitle(isNew ? 'เพิ่มกิจกรรม' : (itemQuery.data?.title ?? 'แก้ไขกิจกรรม'));

  const formFields = useMemo<ResourceFormField[]>(() => {
    const categoryOptions = (categoriesQuery.data?.items ?? []).map((c) => ({ value: c.id, label: c.name }));
    return [
      { name: 'coverImageId', label: 'ภาพหน้าปกกิจกรรม', type: 'image', initialPreview: itemQuery.data?.coverImage },
      { name: 'title', label: 'ชื่อกิจกรรม', type: 'text', colSpan: 2 },
      { name: 'startDate', label: 'วันที่เริ่ม', type: 'date' },
      { name: 'endDate', label: 'วันที่สิ้นสุด', type: 'date' },
      { name: 'location', label: 'สถานที่', type: 'text' },
      { name: 'categoryId', label: 'หมวดหมู่', type: 'select', options: categoryOptions },
      { name: 'description', label: 'รายละเอียดย่อ', type: 'textarea', colSpan: 2, rows: 2 },
      { name: 'content', label: 'เนื้อหาเพิ่มเติม', type: 'textarea', colSpan: 2, rows: 8 },
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

  const handleSubmit = async (values: ActivityInput) => {
    setFormError(null);
    const payload = { ...values, categoryId: values.categoryId || undefined, endDate: values.endDate || undefined };
    try {
      if (isNew) {
        await createMutation.mutateAsync(payload);
        toast.success('เพิ่มกิจกรรมสำเร็จ');
      } else {
        await updateMutation.mutateAsync({ id: id!, data: { ...payload, updatedAt: item?.updatedAt } });
        toast.success('บันทึกการแก้ไขสำเร็จ');
      }
      navigate('/admin/activities');
    } catch (err) {
      setFormError(err instanceof ApiClientError ? err.message : 'บันทึกไม่สำเร็จ กรุณาลองใหม่อีกครั้ง');
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <SectionHeader title={isNew ? 'เพิ่มกิจกรรม' : 'แก้ไขกิจกรรม'} description={item?.title} />

      {!isNew && item && (
        <GlassCard padding="lg">
          <StatusWorkflowControl
            status={item.status}
            permissionGroup="activity"
            isChanging={changeStatusMutation.isPending}
            onChange={(next) => changeStatusMutation.mutateAsync({ id: id!, status: next }).then(() => undefined)}
          />
        </GlassCard>
      )}

      <GlassCard padding="lg">
        <ResourceForm
          fields={formFields}
          schema={activitySchema}
          defaultValues={{
            title: item?.title ?? '',
            description: item?.description ?? '',
            content: item?.content ?? '',
            startDate: item?.startDate ? item.startDate.slice(0, 10) : '',
            endDate: item?.endDate ? item.endDate.slice(0, 10) : '',
            location: item?.location ?? '',
            categoryId: item?.category?.id ?? '',
            coverImageId: item?.coverImage?.id ?? '',
          }}
          onSubmit={handleSubmit}
          onCancel={() => navigate('/admin/activities')}
          submitError={formError}
          submitLabel={isNew ? 'เพิ่มกิจกรรม' : 'บันทึกการแก้ไข'}
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
