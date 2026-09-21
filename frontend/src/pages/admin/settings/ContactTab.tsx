import { z } from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ResourceForm, type ResourceFormField } from '@/components/admin/resource/ResourceForm';
import { useToast } from '@/components/admin/Toast';
import { ApiClientError } from '@/api/client';
import { updateSetting } from '@/api/admin/settings';
import type { SiteSettings } from '@/types';

const schema = z.object({
  address: z.string().trim().min(5, 'กรุณากรอกที่อยู่').max(500),
  phone: z.string().trim().max(50).optional().or(z.literal('')),
  email: z.string().trim().max(200).optional().or(z.literal('')),
  mapEmbedUrl: z.string().trim().max(1000).optional().or(z.literal('')),
  officeHours: z.string().trim().max(200).optional().or(z.literal('')),
});

const fields: ResourceFormField[] = [
  { name: 'address', label: 'ที่อยู่', type: 'textarea', colSpan: 2, rows: 3 },
  { name: 'phone', label: 'เบอร์โทรศัพท์', type: 'text' },
  { name: 'email', label: 'อีเมล', type: 'text' },
  { name: 'officeHours', label: 'เวลาทำการ', type: 'text', colSpan: 2 },
  { name: 'mapEmbedUrl', label: 'ลิงก์แผนที่ฝัง (Google Maps embed URL)', type: 'text', colSpan: 2 },
];

export function ContactTab({ value }: { value: SiteSettings['contact'] }) {
  const toast = useToast();
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: (data: NonNullable<SiteSettings['contact']>) => updateSetting('contact', data),
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
        address: value?.address ?? '',
        phone: value?.phone ?? '',
        email: value?.email ?? '',
        mapEmbedUrl: value?.mapEmbedUrl ?? '',
        officeHours: value?.officeHours ?? '',
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
