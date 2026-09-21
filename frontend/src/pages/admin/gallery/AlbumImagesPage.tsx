import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Plus, Trash2 } from 'lucide-react';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { GlassCard } from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/Button';
import { EmptyState, ErrorState, Spinner } from '@/components/ui/feedback';
import { MediaPickerModal } from '@/components/admin/MediaPickerModal';
import { SortableList, DragHandle } from '@/components/admin/SortableList';
import { useToast } from '@/components/admin/Toast';
import { useConfirm } from '@/components/admin/ConfirmDialog';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { useResourceAdmin } from '@/hooks/admin/useResourceAdmin';
import { ApiClientError } from '@/api/client';
import {
  addAlbumImages,
  listAlbumImages,
  removeAlbumImage,
  reorderAlbumImages,
  updateAlbumImageCaption,
  type GalleryImageAdmin,
} from '@/api/admin/gallery';
import type { AdminAlbum } from '@/types/adminContent';

export function AlbumImagesPage() {
  const { albumId } = useParams<{ albumId: string }>();
  const toast = useToast();
  const confirm = useConfirm();
  const queryClient = useQueryClient();
  const [pickerOpen, setPickerOpen] = useState(false);

  const { useItem } = useResourceAdmin<AdminAlbum, never>('albums');
  const albumQuery = useItem(albumId);
  useDocumentTitle(albumQuery.data ? `รูปภาพในอัลบั้ม: ${albumQuery.data.name}` : 'รูปภาพในอัลบั้ม');

  const queryKey = ['admin', 'gallery', albumId] as const;
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey,
    queryFn: () => listAlbumImages(albumId as string),
    enabled: Boolean(albumId),
  });

  const [localOrder, setLocalOrder] = useState<GalleryImageAdmin[]>([]);
  useEffect(() => {
    if (data) setLocalOrder([...data].sort((a, b) => a.order - b.order));
  }, [data]);

  const invalidate = () => queryClient.invalidateQueries({ queryKey });

  const addMutation = useMutation({
    mutationFn: (mediaId: string) => addAlbumImages(albumId as string, [mediaId]),
    onSuccess: invalidate,
  });
  const removeMutation = useMutation({ mutationFn: removeAlbumImage, onSuccess: invalidate });
  const reorderMutation = useMutation({
    mutationFn: (items: { id: string; order: number }[]) => reorderAlbumImages(albumId as string, items),
    onSuccess: invalidate,
  });
  const captionMutation = useMutation({
    mutationFn: ({ id, caption }: { id: string; caption: string }) => updateAlbumImageCaption(id, caption),
    onSuccess: invalidate,
  });

  const handleAdd = async (media: { id: string }) => {
    setPickerOpen(false);
    try {
      const result = await addMutation.mutateAsync(media.id);
      toast.success(result.skipped > 0 ? 'ภาพนี้มีอยู่ในอัลบั้มแล้ว' : 'เพิ่มภาพสำเร็จ');
    } catch (err) {
      toast.error(err instanceof ApiClientError ? err.message : 'เพิ่มภาพไม่สำเร็จ');
    }
  };

  const handleRemove = async (image: GalleryImageAdmin) => {
    const ok = await confirm({ title: 'นำภาพนี้ออกจากอัลบั้ม?', message: 'ไฟล์ต้นฉบับจะยังอยู่ในคลังสื่อ', confirmLabel: 'นำออก', danger: true });
    if (!ok) return;
    try {
      await removeMutation.mutateAsync(image.id);
      toast.success('นำภาพออกจากอัลบั้มสำเร็จ');
    } catch (err) {
      toast.error(err instanceof ApiClientError ? err.message : 'ทำรายการไม่สำเร็จ');
    }
  };

  const handleReorder = async (items: GalleryImageAdmin[]) => {
    setLocalOrder(items);
    try {
      await reorderMutation.mutateAsync(items.map((it, index) => ({ id: it.id, order: index })));
    } catch (err) {
      toast.error(err instanceof ApiClientError ? err.message : 'จัดลำดับไม่สำเร็จ');
      if (data) setLocalOrder([...data].sort((a, b) => a.order - b.order));
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <Link to="/admin/albums" className="inline-flex w-fit items-center gap-1.5 text-sm text-ink-muted hover:text-ink">
        <ArrowLeft className="size-4" aria-hidden />
        กลับไปหน้าอัลบั้มทั้งหมด
      </Link>

      <SectionHeader
        title={albumQuery.data ? `รูปภาพในอัลบั้ม "${albumQuery.data.name}"` : 'รูปภาพในอัลบั้ม'}
        description="ลากเพื่อจัดลำดับ, ใส่คำบรรยายใต้ภาพ"
        action={
          <Button size="sm" leftIcon={<Plus className="size-4" aria-hidden />} onClick={() => setPickerOpen(true)}>
            เพิ่มภาพ
          </Button>
        }
      />

      {isError && (
        <GlassCard padding="lg">
          <ErrorState onRetry={() => refetch()} />
        </GlassCard>
      )}
      {isLoading && (
        <GlassCard padding="lg">
          <Spinner />
        </GlassCard>
      )}
      {!isLoading && !isError && localOrder.length === 0 && (
        <GlassCard padding="lg">
          <EmptyState message="ยังไม่มีภาพในอัลบั้มนี้" />
        </GlassCard>
      )}

      {!isLoading && localOrder.length > 0 && (
        <SortableList
          items={localOrder}
          onReorder={handleReorder}
          renderItem={(image, handle) => (
            <GlassCard padding="sm" className="flex items-center gap-3">
              <DragHandle {...handle} />
              <img
                src={image.media.thumbnailUrl ?? image.media.url}
                alt={image.media.alt ?? ''}
                className="size-14 shrink-0 rounded-sm object-cover"
              />
              <input
                defaultValue={image.caption ?? ''}
                placeholder="คำบรรยายใต้ภาพ (ไม่บังคับ)"
                onBlur={(e) => {
                  if (e.target.value !== (image.caption ?? '')) {
                    captionMutation.mutate({ id: image.id, caption: e.target.value });
                  }
                }}
                className="glass min-w-0 flex-1 rounded-sm px-3 py-2 text-sm text-ink outline-none focus:ring-2 focus:ring-brand-500"
              />
              <Button variant="ghost" size="xs" onClick={() => handleRemove(image)} aria-label="นำภาพออก">
                <Trash2 className="size-4 text-danger" aria-hidden />
              </Button>
            </GlassCard>
          )}
        />
      )}

      <MediaPickerModal open={pickerOpen} onClose={() => setPickerOpen(false)} onSelect={handleAdd} />
    </div>
  );
}
