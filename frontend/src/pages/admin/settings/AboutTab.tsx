import { z } from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ResourceForm, type ResourceFormField } from '@/components/admin/resource/ResourceForm';
import { useToast } from '@/components/admin/Toast';
import { ApiClientError } from '@/api/client';
import { updateSetting } from '@/api/admin/settings';
import type { SiteSettings } from '@/types';

const schema = z.object({
  history: z.string().trim().min(10, 'กรุณากรอกประวัติแผนก').max(10_000),
  vision: z.string().trim().min(5, 'กรุณากรอกวิสัยทัศน์').max(2_000),
  mission: z.array(z.string()).max(15),
  strengths: z.array(z.string()).max(15),
  goals: z.array(z.string()).max(15),
});

const fields: ResourceFormField[] = [
  { name: 'history', label: 'ประวัติแผนก', type: 'textarea', colSpan: 2, rows: 5 },
  { name: 'vision', label: 'วิสัยทัศน์', type: 'textarea', colSpan: 2, rows: 3 },
  { name: 'mission', label: 'พันธกิจ', type: 'tags', colSpan: 2, placeholder: 'พิมพ์แล้วกด Enter' },
  { name: 'strengths', label: 'จุดแข็งของแผนก', type: 'tags', colSpan: 2, placeholder: 'พิมพ์แล้วกด Enter' },
  { name: 'goals', label: 'เป้าหมาย', type: 'tags', colSpan: 2, placeholder: 'พิมพ์แล้วกด Enter' },
];

export function AboutTab({ value }: { value: SiteSettings['about'] }) {
  const toast = useToast();
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: (data: NonNullable<SiteSettings['about']>) => updateSetting('about', data),
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
        history: value?.history ?? '',
        vision: value?.vision ?? '',
        mission: value?.mission ?? [],
        strengths: value?.strengths ?? [],
        goals: value?.goals ?? [],
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
