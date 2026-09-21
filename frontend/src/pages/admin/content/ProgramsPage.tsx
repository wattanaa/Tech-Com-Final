import { z } from 'zod';
import { Badge } from '@/components/ui/Badge';
import { useResourceAdmin } from '@/hooks/admin/useResourceAdmin';
import { ResourceListPage } from '@/components/admin/ResourceListPage';
import type { ResourceFormField } from '@/components/admin/resource/ResourceForm';
import type { DataTableColumn } from '@/components/admin/resource/DataTable';
import type { AdminProgram } from '@/types/adminContent';

const programSchema = z.object({
  code: z.string().trim().min(2, 'กรุณากรอกรหัสหลักสูตร').max(20),
  name: z.string().trim().min(5, 'กรุณากรอกชื่อหลักสูตร').max(250),
  nameEn: z.string().trim().max(250).optional().or(z.literal('')),
  level: z.enum(['POR_WOR_CHOR', 'POR_WOR_SOR'], { errorMap: () => ({ message: 'กรุณาเลือกระดับ' }) }),
  duration: z.string().trim().min(1, 'กรุณากรอกระยะเวลาเรียน').max(50),
  description: z.string().trim().min(10, 'กรุณากรอกรายละเอียดหลักสูตร').max(5000),
  skills: z.array(z.string()).max(15),
  order: z.coerce.number().int().min(0).max(999),
  isVisible: z.boolean(),
  imageId: z.string().optional().or(z.literal('')),
});
type ProgramInput = z.infer<typeof programSchema>;

const LEVEL_LABEL: Record<AdminProgram['level'], string> = {
  POR_WOR_CHOR: 'ปวช.',
  POR_WOR_SOR: 'ปวส.',
};

const formFields = (p?: AdminProgram): ResourceFormField[] => [
  { name: 'imageId', label: 'รูปภาพหลักสูตร', type: 'image', initialPreview: p?.image },
  { name: 'code', label: 'รหัสหลักสูตร', type: 'text' },
  {
    name: 'level',
    label: 'ระดับ',
    type: 'select',
    options: [
      { value: 'POR_WOR_CHOR', label: 'ปวช.' },
      { value: 'POR_WOR_SOR', label: 'ปวส.' },
    ],
  },
  { name: 'name', label: 'ชื่อหลักสูตร (ไทย)', type: 'text', colSpan: 2 },
  { name: 'nameEn', label: 'ชื่อหลักสูตร (อังกฤษ)', type: 'text', colSpan: 2 },
  { name: 'duration', label: 'ระยะเวลาเรียน', type: 'text', placeholder: 'เช่น 3 ปี' },
  { name: 'order', label: 'ลำดับการแสดงผล', type: 'number' },
  { name: 'description', label: 'รายละเอียดหลักสูตร', type: 'textarea', colSpan: 2, rows: 5 },
  { name: 'skills', label: 'ทักษะที่ได้รับ', type: 'tags', colSpan: 2, placeholder: 'พิมพ์แล้วกด Enter' },
  { name: 'isVisible', label: 'แสดงบนเว็บไซต์', type: 'checkbox' },
];

const columns: DataTableColumn<AdminProgram>[] = [
  { header: 'รหัส', cell: (p) => p.code },
  { header: 'ชื่อหลักสูตร', cell: (p) => p.name },
  { header: 'ระดับ', cell: (p) => <Badge>{LEVEL_LABEL[p.level]}</Badge> },
  { header: 'สถานะ', cell: (p) => (p.isVisible ? <Badge>แสดงอยู่</Badge> : <Badge color="#94a3b8">ซ่อนอยู่</Badge>) },
];

export function ProgramsPage() {
  const { useList, useCreate, useUpdate, useRemove } = useResourceAdmin<AdminProgram, ProgramInput>('programs');

  return (
    <ResourceListPage<AdminProgram, ProgramInput>
      title="หลักสูตร"
      description="จัดการหลักสูตรที่เปิดสอน"
      createLabel="เพิ่มหลักสูตร"
      searchPlaceholder="ค้นหารหัส ชื่อหลักสูตร…"
      emptyMessage="ยังไม่มีหลักสูตร"
      columns={columns}
      formFields={formFields}
      formSchema={programSchema}
      toFormDefaults={(p) => ({
        code: p?.code ?? '',
        name: p?.name ?? '',
        nameEn: p?.nameEn ?? '',
        level: p?.level ?? 'POR_WOR_CHOR',
        duration: p?.duration ?? '',
        description: p?.description ?? '',
        skills: p?.skills ?? [],
        order: p?.order ?? 0,
        isVisible: p?.isVisible ?? true,
        imageId: p?.image?.id ?? '',
      })}
      useList={useList}
      useCreate={useCreate}
      useUpdate={useUpdate}
      useRemove={useRemove}
      getItemLabel={(p) => p.name}
    />
  );
}
