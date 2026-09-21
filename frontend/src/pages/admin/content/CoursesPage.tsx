import { useMemo } from 'react';
import { z } from 'zod';
import { Badge } from '@/components/ui/Badge';
import { useResourceAdmin } from '@/hooks/admin/useResourceAdmin';
import { ResourceListPage } from '@/components/admin/ResourceListPage';
import type { ResourceFormField } from '@/components/admin/resource/ResourceForm';
import type { DataTableColumn } from '@/components/admin/resource/DataTable';
import type { AdminCourse, AdminProgram, AdminTeacher } from '@/types/adminContent';

const courseSchema = z
  .object({
    code: z
      .string()
      .trim()
      .min(4, 'กรุณากรอกรหัสวิชา')
      .max(20)
      .regex(/^[0-9A-Za-z-]+$/, 'รหัสวิชาใส่ได้เฉพาะตัวเลข ตัวอักษร และขีดกลาง'),
    name: z.string().trim().min(3, 'กรุณากรอกชื่อวิชา').max(250),
    nameEn: z.string().trim().max(250).optional().or(z.literal('')),
    credits: z.coerce.number().int().min(0).max(30),
    hours: z.coerce.number().int().min(0).max(60),
    theoryHours: z.coerce.number().int().min(0).max(60),
    practiceHours: z.coerce.number().int().min(0).max(60),
    description: z.string().trim().min(10, 'กรุณากรอกคำอธิบายรายวิชา').max(5000),
    term: z.string().trim().max(20).optional().or(z.literal('')),
    programId: z.string().min(1, 'กรุณาเลือกหลักสูตร'),
    teacherIds: z.array(z.string()).max(10),
    isVisible: z.boolean(),
    imageId: z.string().optional().or(z.literal('')),
  })
  .refine((v) => v.theoryHours + v.practiceHours <= v.hours, {
    message: 'ชั่วโมงทฤษฎีรวมกับปฏิบัติต้องไม่เกินชั่วโมงเรียนทั้งหมด',
    path: ['practiceHours'],
  });
type CourseInput = z.infer<typeof courseSchema>;

const columns: DataTableColumn<AdminCourse>[] = [
  { header: 'รหัสวิชา', cell: (c) => c.code },
  { header: 'ชื่อวิชา', cell: (c) => c.name },
  { header: 'หน่วยกิต', cell: (c) => c.credits },
  { header: 'หลักสูตร', cell: (c) => c.program?.name ?? '—' },
  { header: 'สถานะ', cell: (c) => (c.isVisible ? <Badge>แสดงอยู่</Badge> : <Badge color="#94a3b8">ซ่อนอยู่</Badge>) },
];

export function CoursesPage() {
  const { useList, useCreate, useUpdate, useRemove } = useResourceAdmin<AdminCourse, CourseInput>('courses');
  const programsAdmin = useResourceAdmin<AdminProgram, never>('programs');
  const teachersAdmin = useResourceAdmin<AdminTeacher, never>('teachers');
  const programsQuery = programsAdmin.useList({ limit: 100 });
  const teachersQuery = teachersAdmin.useList({ limit: 100 });

  const formFields = useMemo(() => {
    const programOptions = (programsQuery.data?.items ?? []).map((p) => ({ value: p.id, label: `${p.code} — ${p.name}` }));
    const teacherOptions = (teachersQuery.data?.items ?? []).map((t) => ({
      value: t.id,
      label: `${t.prefix}${t.firstName} ${t.lastName}`,
    }));
    return (c?: AdminCourse): ResourceFormField[] => [
      { name: 'imageId', label: 'รูปภาพรายวิชา', type: 'image', initialPreview: c?.image },
      { name: 'code', label: 'รหัสวิชา', type: 'text' },
      { name: 'programId', label: 'หลักสูตร', type: 'select', options: programOptions },
      { name: 'name', label: 'ชื่อวิชา (ไทย)', type: 'text', colSpan: 2 },
      { name: 'nameEn', label: 'ชื่อวิชา (อังกฤษ)', type: 'text', colSpan: 2 },
      { name: 'credits', label: 'หน่วยกิต', type: 'number' },
      { name: 'term', label: 'ภาคเรียน', type: 'text' },
      { name: 'hours', label: 'ชั่วโมงเรียนรวม', type: 'number' },
      { name: 'theoryHours', label: 'ชั่วโมงทฤษฎี', type: 'number' },
      { name: 'practiceHours', label: 'ชั่วโมงปฏิบัติ', type: 'number' },
      { name: 'description', label: 'คำอธิบายรายวิชา', type: 'textarea', colSpan: 2, rows: 4 },
      { name: 'teacherIds', label: 'ครูผู้สอน', type: 'multiselect', options: teacherOptions, colSpan: 2 },
      { name: 'isVisible', label: 'แสดงบนเว็บไซต์', type: 'checkbox' },
    ];
  }, [programsQuery.data, teachersQuery.data]);

  return (
    <ResourceListPage<AdminCourse, CourseInput>
      title="รายวิชา"
      description="จัดการรายวิชาที่เปิดสอนในแต่ละหลักสูตร"
      createLabel="เพิ่มรายวิชา"
      searchPlaceholder="ค้นหารหัส ชื่อวิชา…"
      emptyMessage="ยังไม่มีรายวิชา"
      columns={columns}
      formFields={formFields}
      formSchema={courseSchema}
      toFormDefaults={(c) => ({
        code: c?.code ?? '',
        name: c?.name ?? '',
        nameEn: c?.nameEn ?? '',
        credits: c?.credits ?? 0,
        hours: c?.hours ?? 0,
        theoryHours: c?.theoryHours ?? 0,
        practiceHours: c?.practiceHours ?? 0,
        description: c?.description ?? '',
        term: c?.term ?? '',
        programId: c?.program?.id ?? '',
        teacherIds: c?.teachers?.map((t) => t.teacher.id) ?? [],
        isVisible: c?.isVisible ?? true,
        imageId: c?.image?.id ?? '',
      })}
      useList={useList}
      useCreate={useCreate}
      useUpdate={useUpdate}
      useRemove={useRemove}
      getItemLabel={(c) => c.name}
    />
  );
}
