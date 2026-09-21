import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { z } from 'zod';
import { Pencil, Plus } from 'lucide-react';
import { GlassCard } from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/Button';
import { EmptyState, ErrorState, Spinner } from '@/components/ui/feedback';
import { Modal } from '@/components/admin/Modal';
import { ResourceForm, type ResourceFormField } from '@/components/admin/resource/ResourceForm';
import { useToast } from '@/components/admin/Toast';
import { ApiClientError } from '@/api/client';
import { listSeoAll, upsertSeo, type SeoSettingRow } from '@/api/admin/settings';

const schema = z.object({
  path: z.string().trim().min(1, 'กรุณากรอกเส้นทางของหน้า').regex(/^\//, 'เส้นทางต้องขึ้นต้นด้วย /'),
  title: z.string().trim().min(5, 'กรุณากรอกชื่อหน้า').max(70),
  description: z.string().trim().max(160, 'ควรยาวไม่เกิน 160 ตัวอักษร').optional().or(z.literal('')),
  keywords: z.array(z.string()).max(15),
  canonical: z.string().trim().max(300).optional().or(z.literal('')),
});
type SeoForm = z.infer<typeof schema>;

const QUERY_KEY = ['admin', 'settings', 'seo'] as const;

const formFields = (isEditing: boolean): ResourceFormField[] => [
  { name: 'path', label: 'เส้นทางของหน้า', type: 'text', placeholder: '/news', colSpan: 2, helperText: isEditing ? 'แก้ path เดิมไม่ได้ — ลบแล้วสร้างใหม่แทน' : undefined },
  { name: 'title', label: 'ชื่อหน้า (title)', type: 'text', colSpan: 2 },
  { name: 'description', label: 'คำอธิบาย (description)', type: 'textarea', colSpan: 2, rows: 2 },
  { name: 'keywords', label: 'คีย์เวิร์ด', type: 'tags', colSpan: 2, placeholder: 'พิมพ์แล้วกด Enter' },
  { name: 'canonical', label: 'Canonical URL (ถ้ามี)', type: 'text', colSpan: 2 },
];

export function SeoTab() {
  const toast = useToast();
  const queryClient = useQueryClient();
  const [modalItem, setModalItem] = useState<SeoSettingRow | 'new' | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const { data, isLoading, isError, refetch } = useQuery({ queryKey: QUERY_KEY, queryFn: listSeoAll });
  const mutation = useMutation({
    mutationFn: upsertSeo,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: QUERY_KEY }),
  });

  const closeModal = () => {
    setModalItem(null);
    setFormError(null);
  };

  const handleSubmit = async (values: SeoForm) => {
    setFormError(null);
    try {
      await mutation.mutateAsync({
        path: values.path,
        title: values.title,
        description: values.description || undefined,
        keywords: values.keywords,
        canonical: values.canonical || undefined,
      });
      toast.success('บันทึก SEO สำเร็จ');
      closeModal();
    } catch (err) {
      setFormError(err instanceof ApiClientError ? err.message : 'บันทึกไม่สำเร็จ กรุณาลองใหม่อีกครั้ง');
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-ink-muted">ตั้งค่า title/description ต่อหน้า — หน้าที่ไม่ได้ตั้งไว้จะใช้ค่าของหน้าแรกแทน</p>
        <Button size="sm" leftIcon={<Plus className="size-4" aria-hidden />} onClick={() => setModalItem('new')}>
          เพิ่มหน้า
        </Button>
      </div>

      {isError && (
        <GlassCard padding="lg">
          <ErrorState onRetry={() => refetch()} />
        </GlassCard>
      )}
      {isLoading && (
        <GlassCard padding="lg">
          <Spinner />
        </GlassCard>
      )}
      {!isLoading && !isError && (data?.length ?? 0) === 0 && (
        <GlassCard padding="lg">
          <EmptyState message="ยังไม่มีการตั้งค่า SEO เฉพาะหน้า" />
        </GlassCard>
      )}

      {data && data.length > 0 && (
        <div className="flex flex-col gap-2">
          {data.map((row) => (
            <GlassCard key={row.id} padding="sm" className="flex items-center gap-3">
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-ink">{row.path}</p>
                <p className="truncate text-xs text-ink-subtle">{row.title}</p>
              </div>
              <Button variant="ghost" size="xs" onClick={() => setModalItem(row)} aria-label={`แก้ไข ${row.path}`}>
                <Pencil className="size-4" aria-hidden />
              </Button>
            </GlassCard>
          ))}
        </div>
      )}

      <Modal open={modalItem !== null} onClose={closeModal} title={modalItem === 'new' ? 'เพิ่มหน้า SEO' : 'แก้ไข SEO'}>
        <ResourceForm
          fields={formFields(modalItem !== 'new')}
          schema={schema}
          defaultValues={{
            path: modalItem !== 'new' ? (modalItem?.path ?? '') : '',
            title: modalItem !== 'new' ? (modalItem?.title ?? '') : '',
            description: modalItem !== 'new' ? (modalItem?.description ?? '') : '',
            keywords: modalItem !== 'new' ? (modalItem?.keywords ?? []) : [],
            canonical: modalItem !== 'new' ? (modalItem?.canonical ?? '') : '',
          }}
          onSubmit={handleSubmit}
          onCancel={closeModal}
          submitError={formError}
        />
      </Modal>
    </div>
  );
}
