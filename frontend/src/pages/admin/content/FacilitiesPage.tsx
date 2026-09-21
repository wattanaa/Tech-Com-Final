import { z } from 'zod';
import { Badge } from '@/components/ui/Badge';
import { useResourceAdmin } from '@/hooks/admin/useResourceAdmin';
import { ResourceListPage } from '@/components/admin/ResourceListPage';
import type { ResourceFormField } from '@/components/admin/resource/ResourceForm';
import type { DataTableColumn } from '@/components/admin/resource/DataTable';
import type { AdminFacility } from '@/types/adminContent';

const facilitySchema = z.object({
  name: z.string().trim().min(3, 'กรุณากรอกชื่อห้อง').max(200),
  description: z.string().trim().min(10, 'กรุณากรอกรายละเอียดห้อง').max(3000),
  computerCount: z.coerce.number().int().min(0).max(999),
  software: z.array(z.string()).max(30),
  equipment: z.array(z.string()).max(30),
  location: z.string().trim().max(200).optional().or(z.literal('')),
  order: z.coerce.number().int().min(0).max(999),
  isVisible: z.boolean(),
  coverImageId: z.string().optional().or(z.literal('')),
});
type FacilityInput = z.infer<typeof facilitySchema>;

const formFields = (f?: AdminFacility): ResourceFormField[] => [
  { name: 'coverImageId', label: 'รูปภาพห้อง', type: 'image', initialPreview: f?.coverImage },
  { name: 'name', label: 'ชื่อห้อง', type: 'text', colSpan: 2 },
  { name: 'computerCount', label: 'จำนวนเครื่องคอมพิวเตอร์', type: 'number' },
  { name: 'location', label: 'ที่ตั้ง', type: 'text' },
  { name: 'description', label: 'รายละเอียดห้อง', type: 'textarea', colSpan: 2, rows: 4 },
  { name: 'software', label: 'ซอฟต์แวร์ในห้อง', type: 'tags', colSpan: 2, placeholder: 'พิมพ์แล้วกด Enter' },
  { name: 'equipment', label: 'อุปกรณ์ในห้อง', type: 'tags', colSpan: 2, placeholder: 'พิมพ์แล้วกด Enter' },
  { name: 'order', label: 'ลำดับการแสดงผล', type: 'number' },
  { name: 'isVisible', label: 'แสดงบนเว็บไซต์', type: 'checkbox' },
];

const columns: DataTableColumn<AdminFacility>[] = [
  { header: 'ชื่อห้อง', cell: (f) => f.name },
  { header: 'จำนวนเครื่อง', cell: (f) => f.computerCount },
  { header: 'ที่ตั้ง', cell: (f) => f.location ?? '—' },
  { header: 'สถานะ', cell: (f) => (f.isVisible ? <Badge>แสดงอยู่</Badge> : <Badge color="#94a3b8">ซ่อนอยู่</Badge>) },
];

export function FacilitiesPage() {
  const { useList, useCreate, useUpdate, useRemove } = useResourceAdmin<AdminFacility, FacilityInput>('facilities');

  return (
    <ResourceListPage<AdminFacility, FacilityInput>
      title="ห้องปฏิบัติการ"
      description="จัดการข้อมูลห้องปฏิบัติการของแผนก"
      createLabel="เพิ่มห้องปฏิบัติการ"
      searchPlaceholder="ค้นหาชื่อห้อง…"
      emptyMessage="ยังไม่มีห้องปฏิบัติการ"
      columns={columns}
      formFields={formFields}
      formSchema={facilitySchema}
      toFormDefaults={(f) => ({
        name: f?.name ?? '',
        description: f?.description ?? '',
        computerCount: f?.computerCount ?? 0,
        software: f?.software ?? [],
        equipment: f?.equipment ?? [],
        location: f?.location ?? '',
        order: f?.order ?? 0,
        isVisible: f?.isVisible ?? true,
        coverImageId: f?.coverImage?.id ?? '',
      })}
      useList={useList}
      useCreate={useCreate}
      useUpdate={useUpdate}
      useRemove={useRemove}
      getItemLabel={(f) => f.name}
    />
  );
}
