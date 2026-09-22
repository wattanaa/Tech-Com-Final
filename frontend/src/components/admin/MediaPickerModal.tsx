import { useRef, useState, type MouseEvent } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Trash2, UploadCloud, Youtube } from 'lucide-react';
import { Modal } from './Modal';
import { useToast } from './Toast';
import { useConfirm } from './ConfirmDialog';
import { ImageCropModal } from './ImageCropModal';
import { SearchInput } from '@/components/ui/SearchInput';
import { Pagination } from '@/components/ui/Pagination';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/feedback';
import { useDebounce } from '@/hooks/useDebounce';
import { useCropUploadQueue } from '@/hooks/admin/useCropUploadQueue';
import { listMedia, removeMedia, uploadMedia, addYoutubeVideo } from '@/api/admin/media';
import { ApiClientError } from '@/api/client';
import { resolveMediaUrl, isVideoMime } from '@/utils/media';
import type { AdminMedia } from '@/types/adminContent';

/**
 * กล่องเลือกรูปภาพจากคลังสื่อ — ใช้ซ้ำได้จากทุก field รูปภาพในฟอร์มหลังบ้าน
 * accept กำหนดชนิดไฟล์ที่รับได้ — ค่าเริ่มต้นรูปภาพเท่านั้น (พฤติกรรมเดิมของทุกจุดที่เรียกอยู่แล้ว)
 * ถ้ามี video/* หรือ image/gif ไฟล์ชนิดนั้นจะข้ามขั้นตอน crop ไปอัปโหลดตรงๆ เพราะ crop ด้วย
 * canvas ทำลาย GIF เคลื่อนไหว (เหลือเฟรมเดียว) และทำกับวิดีโอไม่ได้เลย
 */
export function MediaPickerModal({
  open,
  onClose,
  onSelect,
  accept = 'image/*',
}: {
  open: boolean;
  onClose: () => void;
  onSelect: (media: AdminMedia) => void;
  accept?: string;
}) {
  const toast = useToast();
  const confirm = useConfirm();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const debouncedSearch = useDebounce(search);
  // แสดงช่องวางลิงก์ YouTube เฉพาะจุดที่รับวิดีโอได้ — ไม่ให้กระทบ picker แบบรูปภาพอย่างเดียวเดิม
  const acceptsVideo = accept.includes('video');

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'media', 'picker', page, debouncedSearch],
    queryFn: () => listMedia({ page, limit: 24, search: debouncedSearch || undefined }),
    enabled: open,
  });

  const uploadMutation = useMutation({
    mutationFn: (files: File[]) => uploadMedia(files),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'media'] });
      if (result.failed.length > 0) {
        toast.error(`อัปโหลดไม่สำเร็จ ${result.failed.length} ไฟล์: ${result.failed.map((f) => f.name).join(', ')}`);
      } else {
        toast.success(`อัปโหลดสำเร็จ ${result.uploaded.length} ไฟล์`);
      }
    },
    onError: (err) => toast.error(err instanceof ApiClientError ? err.message : 'อัปโหลดไม่สำเร็จ'),
  });

  const cropQueue = useCropUploadQueue((readyFiles) => uploadMutation.mutate(readyFiles));

  const youtubeMutation = useMutation({
    mutationFn: (url: string) => addYoutubeVideo(url),
    onSuccess: (media) => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'media'] });
      toast.success('เพิ่มวิดีโอ YouTube สำเร็จ');
      setYoutubeUrl('');
      onSelect(media); // ตั้งใจเลือกให้ทันที ต่างจากอัปโหลดไฟล์ปกติที่ต้องกดเลือกเองจากกริด
    },
    onError: (err) => toast.error(err instanceof ApiClientError ? err.message : 'เพิ่มวิดีโอไม่สำเร็จ'),
  });

  const removeMutation = useMutation({
    mutationFn: (id: string) => removeMedia(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin', 'media'] }),
  });

  const handleDelete = async (e: MouseEvent, media: AdminMedia) => {
    e.stopPropagation();
    const ok = await confirm({
      title: `ลบไฟล์ "${media.originalName}" ?`,
      message: 'หากไฟล์นี้ถูกใช้อยู่ที่อื่น ระบบจะปฏิเสธการลบ',
      danger: true,
      confirmLabel: 'ลบ',
    });
    if (!ok) return;
    try {
      await removeMutation.mutateAsync(media.id);
      toast.success('ลบไฟล์สำเร็จ');
    } catch (err) {
      toast.error(err instanceof ApiClientError ? err.message : 'ลบไม่สำเร็จ — ไฟล์นี้อาจถูกใช้งานอยู่');
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="เลือกรูปภาพ" size="lg">
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-3">
          <SearchInput
            value={search}
            onChange={(v) => {
              setSearch(v);
              setPage(1);
            }}
            placeholder="ค้นหาไฟล์…"
            className="flex-1"
          />
          <input
            ref={fileInputRef}
            type="file"
            accept={accept}
            multiple
            hidden
            onChange={(e) => {
              const files = Array.from(e.target.files ?? []);
              // GIF/วิดีโอ crop ด้วย canvas ไม่ได้ (ทำลายเฟรมเคลื่อนไหว/ทำกับวิดีโอไม่ได้เลย) — ข้ามไปอัปโหลดตรง
              const skipCrop = files.filter((f) => f.type === 'image/gif' || f.type.startsWith('video/'));
              const toCrop = files.filter((f) => !skipCrop.includes(f));
              if (skipCrop.length > 0) uploadMutation.mutate(skipCrop);
              if (toCrop.length > 0) cropQueue.start(toCrop);
              e.target.value = '';
            }}
          />
          <Button
            type="button"
            size="sm"
            variant="outline"
            isLoading={uploadMutation.isPending}
            leftIcon={<UploadCloud className="size-4" aria-hidden />}
            onClick={() => fileInputRef.current?.click()}
          >
            อัปโหลด
          </Button>
        </div>

        {acceptsVideo && (
          // ตั้งใจไม่ใช้ <form> ตรงนี้ — MediaPickerModal มักถูกเปิดซ้อนอยู่ใน <form> ของ
          // ResourceForm อีกที (ผ่าน MediaPickerField) แม้ Modal จะ portal ไป document.body
          // แต่ React synthetic event ยังส่ง submit event ขึ้นไปตาม component tree เดิม ทำให้
          // form นอกสุด submit/ปิดตามไปด้วยถ้าใช้ type="submit" ที่นี่ — ใช้ปุ่มกดตรงๆ แทน
          <div className="flex items-center gap-2">
            <div className="glass flex flex-1 items-center gap-2 rounded-sm px-3 py-2">
              <Youtube className="size-4 shrink-0 text-danger" aria-hidden />
              <input
                type="url"
                value={youtubeUrl}
                onChange={(e) => setYoutubeUrl(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && youtubeUrl.trim()) {
                    e.preventDefault();
                    youtubeMutation.mutate(youtubeUrl.trim());
                  }
                }}
                placeholder="วางลิงก์ YouTube ที่นี่ (เช่น https://www.youtube.com/watch?v=…)"
                className="w-full bg-transparent text-sm text-ink outline-none placeholder:text-ink-subtle"
              />
            </div>
            <Button
              type="button"
              size="sm"
              variant="outline"
              isLoading={youtubeMutation.isPending}
              disabled={!youtubeUrl.trim()}
              onClick={() => youtubeMutation.mutate(youtubeUrl.trim())}
            >
              เพิ่ม
            </Button>
          </div>
        )}

        {isLoading ? (
          <Spinner />
        ) : (
          <div className="grid max-h-[50vh] min-h-[200px] grid-cols-3 gap-3 overflow-y-auto sm:grid-cols-4">
            {(data?.items ?? []).map((m) => (
              <div key={m.id} className="group relative aspect-square overflow-hidden rounded-sm border border-hairline/20 transition-colors hover:border-brand-500">
                <button
                  type="button"
                  onClick={() => onSelect(m)}
                  className="block size-full"
                  title={m.originalName}
                >
                  {isVideoMime(m.mimeType) ? (
                    <video
                      src={resolveMediaUrl(m.url)}
                      muted
                      playsInline
                      preload="metadata"
                      className="size-full object-cover transition-transform group-hover:scale-105"
                    />
                  ) : (
                    <img src={resolveMediaUrl(m.thumbnailUrl ?? m.url)} alt={m.alt ?? ''} className="size-full object-cover transition-transform group-hover:scale-105" />
                  )}
                </button>
                <button
                  type="button"
                  onClick={(e) => handleDelete(e, m)}
                  aria-label={`ลบ ${m.originalName}`}
                  className="absolute right-1 top-1 grid size-6 place-items-center rounded-full bg-black/60 text-white opacity-0 transition-opacity hover:bg-danger group-hover:opacity-100"
                >
                  <Trash2 className="size-3.5" aria-hidden />
                </button>
              </div>
            ))}
            {(data?.items ?? []).length === 0 && (
              <p className="col-span-full py-12 text-center text-sm text-ink-subtle">
                ยังไม่มีรูปภาพในคลัง — อัปโหลดไฟล์ใหม่ได้จากปุ่มด้านบน
              </p>
            )}
          </div>
        )}

        {data?.meta && <Pagination page={data.meta.page} totalPages={data.meta.totalPages} onChange={setPage} />}
      </div>

      <ImageCropModal
        file={cropQueue.currentFile}
        open={!!cropQueue.currentFile}
        onCancel={cropQueue.skipCurrent}
        onConfirm={cropQueue.confirmCurrent}
      />
    </Modal>
  );
}
