import { useFieldArray, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/admin/Toast';
import { ApiClientError } from '@/api/client';
import { updateSetting } from '@/api/admin/settings';
import type { SiteSettings } from '@/types';

const schema = z.object({
  description: z.string().trim().min(5, 'กรุณากรอกคำอธิบายท้ายเว็บไซต์').max(1_000),
  copyright: z.string().trim().min(1, 'กรุณากรอกข้อความลิขสิทธิ์').max(300),
  quickLinks: z
    .array(z.object({ label: z.string().trim().min(1, 'กรุณากรอกชื่อลิงก์').max(100), href: z.string().trim().max(300) }))
    .max(12),
});
type FooterForm = z.infer<typeof schema>;

const inputClass = 'glass w-full rounded-sm px-3.5 py-2.5 text-sm text-ink outline-none focus:ring-2 focus:ring-brand-500';

export function FooterTab({ value }: { value: SiteSettings['footer'] }) {
  const toast = useToast();
  const queryClient = useQueryClient();
  const {
    register,
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FooterForm>({
    resolver: zodResolver(schema),
    defaultValues: {
      description: value?.description ?? '',
      copyright: value?.copyright ?? '',
      quickLinks: value?.quickLinks ?? [],
    },
  });
  const { fields, append, remove } = useFieldArray({ control, name: 'quickLinks' });

  const mutation = useMutation({
    mutationFn: (data: FooterForm) => updateSetting('footer', data),
    onSuccess: () => {
      toast.success('บันทึกการตั้งค่าสำเร็จ');
      queryClient.invalidateQueries({ queryKey: ['settings'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'settings'] });
    },
    onError: (err) => toast.error(err instanceof ApiClientError ? err.message : 'บันทึกไม่สำเร็จ'),
  });

  return (
    <form onSubmit={handleSubmit((v) => mutation.mutateAsync(v))} className="flex flex-col gap-4" noValidate>
      <div className="flex flex-col gap-1.5">
        <label htmlFor="description" className="text-sm font-medium text-ink">
          คำอธิบายท้ายเว็บไซต์
        </label>
        <textarea id="description" rows={3} {...register('description')} className={inputClass} />
        {errors.description && <p className="text-xs text-danger">{errors.description.message}</p>}
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="copyright" className="text-sm font-medium text-ink">
          ข้อความลิขสิทธิ์
        </label>
        <input id="copyright" {...register('copyright')} className={inputClass} />
        {errors.copyright && <p className="text-xs text-danger">{errors.copyright.message}</p>}
      </div>

      <div className="flex flex-col gap-2">
        <p className="text-sm font-medium text-ink">ลิงก์ด่วน</p>
        {fields.map((field, index) => (
          <div key={field.id} className="flex items-center gap-2">
            <input
              placeholder="ชื่อลิงก์"
              {...register(`quickLinks.${index}.label`)}
              className={inputClass}
            />
            <input
              placeholder="/path หรือ https://..."
              {...register(`quickLinks.${index}.href`)}
              className={inputClass}
            />
            <Button type="button" variant="ghost" size="xs" onClick={() => remove(index)} aria-label="ลบลิงก์นี้">
              <Trash2 className="size-4 text-danger" aria-hidden />
            </Button>
          </div>
        ))}
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="self-start"
          leftIcon={<Plus className="size-4" aria-hidden />}
          onClick={() => append({ label: '', href: '' })}
        >
          เพิ่มลิงก์
        </Button>
      </div>

      <div className="mt-2 flex justify-end">
        <Button type="submit" size="sm" isLoading={isSubmitting}>
          บันทึกการตั้งค่า
        </Button>
      </div>
    </form>
  );
}
