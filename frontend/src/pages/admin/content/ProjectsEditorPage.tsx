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
import type { AdminCategory, AdminProject, AdminStudent, AdminTeacher } from '@/types/adminContent';

const projectSchema = z.object({
  name: z.string().trim().min(5, 'กรุณากรอกชื่อผลงาน').max(250),
  description: z.string().trim().min(10, 'กรุณากรอกรายละเอียดผลงาน').max(5000),
  year: z.coerce.number().int().min(2500, 'ปีการศึกษาต้องเป็นปี พ.ศ.').max(2700),
  technologies: z.array(z.string()).max(15),
  demoUrl: z.string().trim().url('ต้องขึ้นต้นด้วย https://').optional().or(z.literal('')),
  githubUrl: z.string().trim().url('ต้องขึ้นต้นด้วย https://').optional().or(z.literal('')),
  award: z.string().trim().max(250).optional().or(z.literal('')),
  categoryId: z.string().optional().or(z.literal('')),
  advisorId: z.string().optional().or(z.literal('')),
  memberIds: z.array(z.string()).max(10),
  coverImageId: z.string().optional().or(z.literal('')),
});
type ProjectInput = z.infer<typeof projectSchema>;

export function ProjectsEditorPage() {
  const { id } = useParams<{ id: string }>();
  const isNew = !id || id === 'new';
  const navigate = useNavigate();
  const toast = useToast();
  const [formError, setFormError] = useState<string | null>(null);

  const { useItem, useCreate, useUpdate, useChangeStatus, useVersions, useRestoreVersion } = useResourceAdmin<
    AdminProject,
    ProjectInput
  >('projects');
  const categoriesAdmin = useResourceAdmin<AdminCategory, never>('categories');
  const categoriesQuery = categoriesAdmin.useList({ limit: 100, type: 'PROJECT' });
  const teachersAdmin = useResourceAdmin<AdminTeacher, never>('teachers');
  const teachersQuery = teachersAdmin.useList({ limit: 100 });
  const studentsAdmin = useResourceAdmin<AdminStudent, never>('students');
  const studentsQuery = studentsAdmin.useList({ limit: 100 });

  const itemQuery = useItem(isNew ? undefined : id);
  const createMutation = useCreate();
  const updateMutation = useUpdate();
  const changeStatusMutation = useChangeStatus();
  const versionsQuery = useVersions(isNew ? undefined : id);
  const restoreVersionMutation = useRestoreVersion(id ?? '');

  useDocumentTitle(isNew ? 'เพิ่มผลงาน' : (itemQuery.data?.name ?? 'แก้ไขผลงาน'));

  const formFields = useMemo<ResourceFormField[]>(() => {
    const categoryOptions = (categoriesQuery.data?.items ?? []).map((c) => ({ value: c.id, label: c.name }));
    const teacherOptions = (teachersQuery.data?.items ?? []).map((t) => ({
      value: t.id,
      label: `${t.prefix}${t.firstName} ${t.lastName}`,
    }));
    const studentOptions = (studentsQuery.data?.items ?? []).map((s) => ({
      value: s.id,
      label: `${s.studentCode} — ${s.prefix}${s.firstName} ${s.lastName}`,
    }));
    return [
      { name: 'coverImageId', label: 'ภาพหน้าปกผลงาน', type: 'image', initialPreview: itemQuery.data?.coverImage },
      { name: 'name', label: 'ชื่อผลงาน', type: 'text', colSpan: 2 },
      { name: 'year', label: 'ปีการศึกษา (พ.ศ.)', type: 'number' },
      { name: 'categoryId', label: 'หมวดหมู่', type: 'select', options: categoryOptions },
      { name: 'advisorId', label: 'อาจารย์ที่ปรึกษา', type: 'select', options: teacherOptions },
      { name: 'award', label: 'รางวัลที่ได้รับ', type: 'text' },
      { name: 'demoUrl', label: 'ลิงก์ตัวอย่างผลงาน', type: 'text', placeholder: 'https://...' },
      { name: 'githubUrl', label: 'ลิงก์ GitHub', type: 'text', placeholder: 'https://github.com/...' },
      { name: 'description', label: 'รายละเอียดผลงาน', type: 'textarea', colSpan: 2, rows: 6 },
      { name: 'technologies', label: 'เทคโนโลยีที่ใช้', type: 'tags', colSpan: 2, placeholder: 'พิมพ์แล้วกด Enter' },
      { name: 'memberIds', label: 'เจ้าของผลงาน (นักศึกษา)', type: 'multiselect', options: studentOptions, colSpan: 2 },
    ];
  }, [categoriesQuery.data, teachersQuery.data, studentsQuery.data, itemQuery.data]);

  if (!isNew && itemQuery.isLoading) {
    return (
      <GlassCard padding="lg">
        <Spinner />
      </GlassCard>
    );
  }

  const item = itemQuery.data;

  const handleSubmit = async (values: ProjectInput) => {
    setFormError(null);
    const payload = {
      ...values,
      categoryId: values.categoryId || undefined,
      advisorId: values.advisorId || undefined,
      demoUrl: values.demoUrl || undefined,
      githubUrl: values.githubUrl || undefined,
    };
    try {
      if (isNew) {
        await createMutation.mutateAsync(payload);
        toast.success('เพิ่มผลงานสำเร็จ');
      } else {
        await updateMutation.mutateAsync({ id: id!, data: { ...payload, updatedAt: item?.updatedAt } });
        toast.success('บันทึกการแก้ไขสำเร็จ');
      }
      navigate('/admin/projects');
    } catch (err) {
      setFormError(err instanceof ApiClientError ? err.message : 'บันทึกไม่สำเร็จ กรุณาลองใหม่อีกครั้ง');
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <SectionHeader title={isNew ? 'เพิ่มผลงาน' : 'แก้ไขผลงาน'} description={item?.name} />

      {!isNew && item && (
        <GlassCard padding="lg">
          <StatusWorkflowControl
            status={item.status}
            permissionGroup="project"
            isChanging={changeStatusMutation.isPending}
            onChange={(next) => changeStatusMutation.mutateAsync({ id: id!, status: next }).then(() => undefined)}
          />
        </GlassCard>
      )}

      <GlassCard padding="lg">
        <ResourceForm
          fields={formFields}
          schema={projectSchema}
          defaultValues={{
            name: item?.name ?? '',
            description: item?.description ?? '',
            year: item?.year ?? new Date().getFullYear() + 543,
            technologies: item?.technologies ?? [],
            demoUrl: item?.demoUrl ?? '',
            githubUrl: item?.githubUrl ?? '',
            award: item?.award ?? '',
            categoryId: item?.category?.id ?? '',
            advisorId: item?.advisor?.id ?? '',
            memberIds: item?.members?.map((m) => m.student.id) ?? [],
            coverImageId: item?.coverImage?.id ?? '',
          }}
          onSubmit={handleSubmit}
          onCancel={() => navigate('/admin/projects')}
          submitError={formError}
          submitLabel={isNew ? 'เพิ่มผลงาน' : 'บันทึกการแก้ไข'}
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
