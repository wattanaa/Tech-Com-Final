import { z } from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ResourceForm, type ResourceFormField } from '@/components/admin/resource/ResourceForm';
import { useToast } from '@/components/admin/Toast';
import { ApiClientError } from '@/api/client';
import { updateSetting } from '@/api/admin/settings';
import type { SiteSettings } from '@/types';

const schema = z.object({
  facebook: z.string().trim().max(300).optional().or(z.literal('')),
  youtube: z.string().trim().max(300).optional().or(z.literal('')),
  line: z.string().trim().max(300).optional().or(z.literal('')),
  tiktok: z.string().trim().max(300).optional().or(z.literal('')),
});

const fields: ResourceFormField[] = [
  { name: 'facebook', label: 'Facebook', type: 'text', placeholder: 'https://facebook.com/...', colSpan: 2 },
  { name: 'youtube', label: 'YouTube', type: 'text', placeholder: 'https://youtube.com/...', colSpan: 2 },
  { name: 'line', label: 'LINE', type: 'text', colSpan: 2 },
  { name: 'tiktok', label: 'TikTok', type: 'text', placeholder: 'https://tiktok.com/@...', colSpan: 2 },
];

export function SocialTab({ value }: { value: SiteSettings['social'] }) {
  const toast = useToast();
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: (data: NonNullable<SiteSettings['social']>) => updateSetting('social', data),
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
        facebook: value?.facebook ?? '',
        youtube: value?.youtube ?? '',
        line: value?.line ?? '',
        tiktok: value?.tiktok ?? '',
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
