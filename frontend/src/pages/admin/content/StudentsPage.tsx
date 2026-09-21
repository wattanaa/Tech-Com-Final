import { useMemo } from 'react';
import { z } from 'zod';
import { Badge } from '@/components/ui/Badge';
import { useResourceAdmin } from '@/hooks/admin/useResourceAdmin';
import { ResourceListPage } from '@/components/admin/ResourceListPage';
import type { ResourceFormField } from '@/components/admin/resource/ResourceForm';
import type { DataTableColumn } from '@/components/admin/resource/DataTable';
import type { AdminProgram, AdminStudent } from '@/types/adminContent';

const studentSchema = z.object({
  studentCode: z
    .string()
    .trim()
    .min(4, 'กรุณากรอกรหัสนักศึกษา')
    .max(20)
    .regex(/^[0-9-]+$/, 'รหัสนักศึกษาใส่ได้เฉพาะตัวเลข'),
  prefix: z.string().trim().min(1, 'กรุณากรอกคำนำหน้าชื่อ').max(30),
  firstName: z.string().trim().min(1, 'กรุณากรอกชื่อ').max(100),
  lastName: z.string().trim().min(1, 'กรุณากรอกนามสกุล').max(100),
  level: z.string().trim().min(1, 'กรุณากรอกระดับชั้น').max(30),
  classRoom: z.string().trim().max(30).optional().or(z.literal('')),
  year: z.coerce.number().int().min(2500).max(2700),
  programId: z.string().optional().or(z.literal('')),
  photoId: z.string().optional().or(z.literal('')),
  isVisible: z.boolean(),
});
type StudentInput = z.infer<typeof studentSchema>;

const columns: DataTableColumn<AdminStudent>[] = [
  { header: 'รหัสนักศึกษา', cell: (s) => s.studentCode },
  { header: 'ชื่อ-สกุล', cell: (s) => `${s.prefix}${s.firstName} ${s.lastName}` },
  { header: 'ระดับชั้น', cell: (s) => `${s.level}${s.classRoom ? ` / ${s.classRoom}` : ''}` },
  { header: 'หลักสูตร', cell: (s) => s.program?.name ?? '—' },
  { header: 'สถานะ', cell: (s) => (s.isVisible ? <Badge>แสดงอยู่</Badge> : <Badge color="#94a3b8">ซ่อนอยู่</Badge>) },
];

export function StudentsPage() {
  const { useList, useCreate, useUpdate, useRemove } = useResourceAdmin<AdminStudent, StudentInput>('students');
  const programsAdmin = useResourceAdmin<AdminProgram, never>('programs');
  const programsQuery = programsAdmin.useList({ limit: 100 });

  const formFields = useMemo(() => {
    const programOptions = (programsQuery.data?.items ?? []).map((p) => ({ value: p.id, label: `${p.code} — ${p.name}` }));
    return (s?: AdminStudent): ResourceFormField[] => [
      { name: 'photoId', label: 'รูปประจำตัว', type: 'image', initialPreview: s?.photo },
      { name: 'studentCode', label: 'รหัสนักศึกษา', type: 'text' },
      { name: 'year', label: 'ปีการศึกษาที่เข้า (พ.ศ.)', type: 'number' },
      { name: 'prefix', label: 'คำนำหน้าชื่อ', type: 'text' },
      { name: 'firstName', label: 'ชื่อ', type: 'text' },
      { name: 'lastName', label: 'นามสกุล', type: 'text' },
      { name: 'level', label: 'ระดับชั้น', type: 'text', placeholder: 'เช่น ปวช.3' },
      { name: 'classRoom', label: 'ห้อง', type: 'text' },
      { name: 'programId', label: 'หลักสูตร', type: 'select', options: programOptions, colSpan: 2 },
      { name: 'isVisible', label: 'แสดงบนเว็บไซต์', type: 'checkbox' },
    ];
  }, [programsQuery.data]);

  return (
    <ResourceListPage<AdminStudent, StudentInput>
      title="นักศึกษา"
      description="จัดการข้อมูลนักศึกษาที่แสดงบนเว็บไซต์"
      createLabel="เพิ่มนักศึกษา"
      searchPlaceholder="ค้นหารหัส ชื่อนักศึกษา…"
      emptyMessage="ยังไม่มีข้อมูลนักศึกษา"
      columns={columns}
      formFields={formFields}
      formSchema={studentSchema}
      toFormDefaults={(s) => ({
        studentCode: s?.studentCode ?? '',
        prefix: s?.prefix ?? '',
        firstName: s?.firstName ?? '',
        lastName: s?.lastName ?? '',
        level: s?.level ?? '',
        classRoom: s?.classRoom ?? '',
        year: s?.year ?? new Date().getFullYear() + 543,
        programId: s?.program?.id ?? '',
        photoId: s?.photo?.id ?? '',
        isVisible: s?.isVisible ?? true,
      })}
      useList={useList}
      useCreate={useCreate}
      useUpdate={useUpdate}
      useRemove={useRemove}
      getItemLabel={(s) => `${s.prefix}${s.firstName} ${s.lastName}`}
    />
  );
}
