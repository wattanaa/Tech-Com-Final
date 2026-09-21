import { z } from 'zod';
import { Link } from 'react-router-dom';
import { Images } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { useResourceAdmin } from '@/hooks/admin/useResourceAdmin';
import { ResourceListPage } from '@/components/admin/ResourceListPage';
import type { ResourceFormField } from '@/components/admin/resource/ResourceForm';
import type { DataTableColumn } from '@/components/admin/resource/DataTable';
import type { AdminAlbum } from '@/types/adminContent';

const albumSchema = z.object({
  name: z.string().trim().min(3, 'กรุณากรอกชื่ออัลบั้ม').max(200),
  description: z.string().trim().max(1000).optional().or(z.literal('')),
  eventDate: z.string().optional().or(z.literal('')),
  isPublished: z.boolean(),
  order: z.coerce.number().int().min(0).max(999),
  coverImageId: z.string().optional().or(z.literal('')),
});
type AlbumInput = z.infer<typeof albumSchema>;

const formFields = (a?: AdminAlbum): ResourceFormField[] => [
  { name: 'coverImageId', label: 'ภาพหน้าปกอัลบั้ม', type: 'image', initialPreview: a?.coverImage },
  { name: 'name', label: 'ชื่ออัลบั้ม', type: 'text', colSpan: 2 },
  { name: 'eventDate', label: 'วันที่จัดกิจกรรม', type: 'date' },
  { name: 'order', label: 'ลำดับการแสดงผล', type: 'number' },
  { name: 'description', label: 'รายละเอียด', type: 'textarea', colSpan: 2 },
  { name: 'isPublished', label: 'เผยแพร่บนเว็บไซต์', type: 'checkbox' },
];

const columns: DataTableColumn<AdminAlbum>[] = [
  { header: 'ชื่ออัลบั้ม', cell: (a) => a.name },
  { header: 'จำนวนภาพ', cell: (a) => a._count?.images ?? 0 },
  { header: 'วันที่', cell: (a) => (a.eventDate ? new Date(a.eventDate).toLocaleDateString('th-TH') : '—') },
  { header: 'สถานะ', cell: (a) => (a.isPublished ? <Badge>เผยแพร่แล้ว</Badge> : <Badge color="#94a3b8">ยังไม่เผยแพร่</Badge>) },
  {
    header: '',
    cell: (a) => (
      <Link to={`/admin/gallery/${a.id}`}>
        <Button variant="outline" size="xs" leftIcon={<Images className="size-3.5" aria-hidden />}>
          จัดการรูปภาพ
        </Button>
      </Link>
    ),
  },
];

export function AlbumsPage() {
  const { useList, useCreate, useUpdate, useRemove } = useResourceAdmin<AdminAlbum, AlbumInput>('albums');

  return (
    <ResourceListPage<AdminAlbum, AlbumInput>
      title="อัลบั้มภาพ"
      description="จัดการอัลบั้มคลังภาพกิจกรรม — เพิ่ม/จัดเรียงภาพภายในอัลบั้มทำได้ที่หน้าคลังภาพ"
      createLabel="เพิ่มอัลบั้ม"
      searchPlaceholder="ค้นหาชื่ออัลบั้ม…"
      emptyMessage="ยังไม่มีอัลบั้ม"
      columns={columns}
      formFields={formFields}
      formSchema={albumSchema}
      toFormDefaults={(a) => ({
        name: a?.name ?? '',
        description: a?.description ?? '',
        eventDate: a?.eventDate ? a.eventDate.slice(0, 10) : '',
        isPublished: a?.isPublished ?? false,
        order: a?.order ?? 0,
        coverImageId: a?.coverImage?.id ?? '',
      })}
      useList={useList}
      useCreate={useCreate}
      useUpdate={useUpdate}
      useRemove={useRemove}
      getItemLabel={(a) => a.name}
    />
  );
}
