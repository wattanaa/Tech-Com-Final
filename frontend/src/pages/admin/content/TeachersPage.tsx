import { z } from 'zod';
import { Badge } from '@/components/ui/Badge';
import { useResourceAdmin } from '@/hooks/admin/useResourceAdmin';
import { ResourceListPage } from '@/components/admin/ResourceListPage';
import type { ResourceFormField } from '@/components/admin/resource/ResourceForm';
import type { DataTableColumn } from '@/components/admin/resource/DataTable';
import type { AdminTeacher } from '@/types/adminContent';

const teacherSchema = z.object({
  photoId: z.string().optional().or(z.literal('')),
  prefix: z.string().trim().min(1, 'กรุณากรอกคำนำหน้าชื่อ').max(30),
  firstName: z.string().trim().min(1, 'กรุณากรอกชื่อ').max(100),
  lastName: z.string().trim().min(1, 'กรุณากรอกนามสกุล').max(100),
  position: z.string().trim().min(1, 'กรุณากรอกตำแหน่ง').max(150),
  academicRank: z.string().trim().max(150).optional().or(z.literal('')),
  type: z.enum(['HEAD', 'TEACHER', 'STAFF']),
  specialties: z.array(z.string()).max(10),
  bio: z.string().trim().max(3000).optional().or(z.literal('')),
  email: z.string().trim().email('รูปแบบอีเมลไม่ถูกต้อง').optional().or(z.literal('')),
  phone: z.string().trim().max(30).optional().or(z.literal('')),
  facebook: z.string().trim().url('ต้องขึ้นต้นด้วย https://').optional().or(z.literal('')),
  line: z.string().trim().max(100).optional().or(z.literal('')),
  order: z.coerce.number().int().min(0).max(999),
  isVisible: z.boolean(),
});
type TeacherInput = z.infer<typeof teacherSchema>;

const TYPE_LABEL: Record<AdminTeacher['type'], string> = {
  HEAD: 'หัวหน้าแผนก',
  TEACHER: 'ครูผู้สอน',
  STAFF: 'เจ้าหน้าที่',
};

const formFields = (t?: AdminTeacher): ResourceFormField[] => [
  { name: 'photoId', label: 'รูปประจำตัว', type: 'image', initialPreview: t?.photo },
  { name: 'prefix', label: 'คำนำหน้าชื่อ', type: 'text', placeholder: 'อาจารย์' },
  { name: 'firstName', label: 'ชื่อ', type: 'text' },
  { name: 'lastName', label: 'นามสกุล', type: 'text' },
  { name: 'position', label: 'ตำแหน่ง', type: 'text', colSpan: 2 },
  { name: 'academicRank', label: 'วิทยฐานะ', type: 'text' },
  {
    name: 'type',
    label: 'ประเภท',
    type: 'select',
    options: [
      { value: 'HEAD', label: 'หัวหน้าแผนก' },
      { value: 'TEACHER', label: 'ครูผู้สอน' },
      { value: 'STAFF', label: 'เจ้าหน้าที่' },
    ],
  },
  { name: 'email', label: 'อีเมล', type: 'text' },
  { name: 'phone', label: 'เบอร์โทร', type: 'text' },
  { name: 'facebook', label: 'ลิงก์ Facebook', type: 'text', placeholder: 'https://facebook.com/...' },
  { name: 'line', label: 'Line ID', type: 'text' },
  { name: 'specialties', label: 'ความเชี่ยวชาญ', type: 'tags', colSpan: 2, placeholder: 'พิมพ์แล้วกด Enter' },
  { name: 'bio', label: 'ประวัติโดยย่อ', type: 'textarea', colSpan: 2 },
  { name: 'order', label: 'ลำดับการแสดงผล', type: 'number' },
  { name: 'isVisible', label: 'แสดงบนเว็บไซต์', type: 'checkbox' },
];

const columns: DataTableColumn<AdminTeacher>[] = [
  { header: 'ชื่อ-สกุล', cell: (t) => `${t.prefix}${t.firstName} ${t.lastName}` },
  { header: 'ตำแหน่ง', cell: (t) => t.position },
  { header: 'ประเภท', cell: (t) => <Badge>{TYPE_LABEL[t.type]}</Badge> },
  { header: 'สถานะ', cell: (t) => (t.isVisible ? <Badge>แสดงอยู่</Badge> : <Badge color="#94a3b8">ซ่อนอยู่</Badge>) },
];

export function TeachersPage() {
  const { useList, useCreate, useUpdate, useRemove } = useResourceAdmin<AdminTeacher, TeacherInput>('teachers');

  return (
    <ResourceListPage<AdminTeacher, TeacherInput>
      title="ครูและบุคลากร"
      description="จัดการข้อมูลครูและบุคลากรที่แสดงบนเว็บไซต์"
      createLabel="เพิ่มบุคลากร"
      searchPlaceholder="ค้นหาชื่อ ตำแหน่ง…"
      emptyMessage="ยังไม่มีข้อมูลบุคลากร"
      columns={columns}
      formFields={formFields}
      formSchema={teacherSchema}
      toFormDefaults={(t) => ({
        photoId: t?.photo?.id ?? '',
        prefix: t?.prefix ?? '',
        firstName: t?.firstName ?? '',
        lastName: t?.lastName ?? '',
        position: t?.position ?? '',
        academicRank: t?.academicRank ?? '',
        type: t?.type ?? 'TEACHER',
        specialties: t?.specialties ?? [],
        bio: t?.bio ?? '',
        email: t?.email ?? '',
        phone: t?.phone ?? '',
        facebook: t?.facebook ?? '',
        line: t?.line ?? '',
        order: t?.order ?? 0,
        isVisible: t?.isVisible ?? true,
      })}
      useList={useList}
      useCreate={useCreate}
      useUpdate={useUpdate}
      useRemove={useRemove}
      getItemLabel={(t) => `${t.prefix}${t.firstName} ${t.lastName}`}
    />
  );
}
