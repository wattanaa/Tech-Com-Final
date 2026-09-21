import { z } from 'zod';
import { Badge } from '@/components/ui/Badge';
import { useResourceAdmin } from '@/hooks/admin/useResourceAdmin';
import { ResourceListPage } from '@/components/admin/ResourceListPage';
import type { ResourceFormField } from '@/components/admin/resource/ResourceForm';
import type { DataTableColumn } from '@/components/admin/resource/DataTable';
import type { AdminCategory } from '@/types/adminContent';

const categorySchema = z.object({
  name: z.string().trim().min(1, 'กรุณากรอกชื่อหมวดหมู่').max(100),
  slug: z
    .string()
    .trim()
    .min(1, 'กรุณากรอก slug')
    .max(100)
    .regex(/^[a-z0-9-]+$/, 'slug ใส่ได้เฉพาะ a-z ตัวเลข และขีดกลาง'),
  type: z.enum(['NEWS', 'ACTIVITY', 'PROJECT'], { errorMap: () => ({ message: 'กรุณาเลือกประเภท' }) }),
  color: z.string().trim().regex(/^#[0-9A-Fa-f]{6}$/, 'สีต้องอยู่ในรูปแบบ #RRGGBB'),
  order: z.coerce.number().int().min(0).max(999),
});
type CategoryInput = z.infer<typeof categorySchema>;

const TYPE_LABEL: Record<AdminCategory['type'], string> = {
  NEWS: 'ข่าว',
  ACTIVITY: 'กิจกรรม',
  PROJECT: 'ผลงาน',
};

const formFields: ResourceFormField[] = [
  { name: 'name', label: 'ชื่อหมวดหมู่', type: 'text' },
  { name: 'slug', label: 'Slug', type: 'text', placeholder: 'general' },
  {
    name: 'type',
    label: 'ใช้กับ',
    type: 'select',
    options: [
      { value: 'NEWS', label: 'ข่าว' },
      { value: 'ACTIVITY', label: 'กิจกรรม' },
      { value: 'PROJECT', label: 'ผลงาน' },
    ],
  },
  { name: 'color', label: 'สี', type: 'color' },
  { name: 'order', label: 'ลำดับการแสดงผล', type: 'number' },
];

const columns: DataTableColumn<AdminCategory>[] = [
  {
    header: 'ชื่อหมวดหมู่',
    cell: (c) => <Badge color={c.color}>{c.name}</Badge>,
  },
  { header: 'ใช้กับ', cell: (c) => TYPE_LABEL[c.type] },
  { header: 'Slug', cell: (c) => c.slug },
];

export function CategoriesPage() {
  const { useList, useCreate, useUpdate, useRemove } = useResourceAdmin<AdminCategory, CategoryInput>('categories');

  return (
    <ResourceListPage<AdminCategory, CategoryInput>
      title="หมวดหมู่"
      description="จัดการหมวดหมู่สำหรับข่าว กิจกรรม และผลงาน"
      createLabel="เพิ่มหมวดหมู่"
      searchPlaceholder="ค้นหาชื่อหมวดหมู่…"
      emptyMessage="ยังไม่มีหมวดหมู่"
      columns={columns}
      formFields={formFields}
      formSchema={categorySchema}
      toFormDefaults={(c) => ({
        name: c?.name ?? '',
        slug: c?.slug ?? '',
        type: c?.type ?? 'NEWS',
        color: c?.color ?? '#0284c7',
        order: c?.order ?? 0,
      })}
      useList={useList}
      useCreate={useCreate}
      useUpdate={useUpdate}
      useRemove={useRemove}
      getItemLabel={(c) => c.name}
    />
  );
}
