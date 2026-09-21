import { z } from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ResourceForm, type ResourceFormField } from '@/components/admin/resource/ResourceForm';
import { useToast } from '@/components/admin/Toast';
import { ApiClientError } from '@/api/client';
import { updateSetting } from '@/api/admin/settings';
import type { SiteSettings } from '@/types';

const schema = z.object({
  siteName: z.string().trim().min(1, 'กรุณากรอกชื่อเว็บไซต์').max(200),
  collegeName: z.string().trim().min(1, 'กรุณากรอกชื่อวิทยาลัย').max(200),
  tagline: z.string().trim().max(300).optional().or(z.literal('')),
});

const fields: ResourceFormField[] = [
  { name: 'siteName', label: 'ชื่อเว็บไซต์', type: 'text', colSpan: 2 },
  { name: 'collegeName', label: 'ชื่อวิทยาลัย', type: 'text', colSpan: 2 },
  { name: 'tagline', label: 'คำขวัญ / แท็กไลน์', type: 'text', colSpan: 2 },
];

export function GeneralTab({ value }: { value: SiteSettings['general'] }) {
  const toast = useToast();
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: (data: NonNullable<SiteSettings['general']>) => updateSetting('general', data),
    onSuccess: () => {
      toast.success('บันทึกการตั้งค่าสำเร็จ');
      queryClient.invalidateQueries({ queryKey: ['settings'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'settings'] });
    },
    onError: (err) => toast.error(err instanceof ApiClientError ? err.message : 'บันทึกไม่สำเร็จ'),
  });

  return (
    <ResourceForm
      fields={fields}
      schema={schema}
      defaultValues={{
        siteName: value?.siteName ?? '',
        collegeName: value?.collegeName ?? '',
        tagline: value?.tagline ?? '',
      }}
      onSubmit={async (v) => {
        await mutation.mutateAsync(v);
      }}
      onCancel={() => undefined}
      hideCancel
      submitLabel="บันทึกการตั้งค่า"
    />
  );
}
