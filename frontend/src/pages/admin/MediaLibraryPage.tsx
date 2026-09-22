import { useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Trash2, UploadCloud } from 'lucide-react';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { SearchInput } from '@/components/ui/SearchInput';
import { Pagination } from '@/components/ui/Pagination';
import { Button } from '@/components/ui/Button';
import { GlassCard } from '@/components/ui/GlassCard';
import { EmptyState, ErrorState, Skeleton } from '@/components/ui/feedback';
import { useToast } from '@/components/admin/Toast';
import { useConfirm } from '@/components/admin/ConfirmDialog';
import { ImageCropModal } from '@/components/admin/ImageCropModal';
import { useDebounce } from '@/hooks/useDebounce';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { useCropUploadQueue } from '@/hooks/admin/useCropUploadQueue';
import { listMedia, removeMedia, uploadMedia } from '@/api/admin/media';
import { resolveMediaUrl, isVideoMime } from '@/utils/media';
import { ApiClientError } from '@/api/client';

const FILE_SIZE_UNITS = ['B', 'KB', 'MB', 'GB'];
function formatSize(bytes: number): string {
  let size = bytes;
  let unit = 0;
  while (size >= 1024 && unit < FILE_SIZE_UNITS.length - 1) {
    size /= 1024;
    unit += 1;
  }
  return `${size.toFixed(size >= 10 || unit === 0 ? 0 : 1)} ${FILE_SIZE_UNITS[unit]}`;
}

export function MediaLibraryPage() {
  useDocumentTitle('คลังสื่อ');
  const toast = useToast();
  const confirm = useConfirm();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [folder, setFolder] = useState('');
  const debouncedSearch = useDebounce(search);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['admin', 'media', 'library', page, debouncedSearch, folder],
    queryFn: () => listMedia({ page, limit: 24, search: debouncedSearch || undefined, type: folder || undefined }),
  });

  const uploadMutation = useMutation({
    mutationFn: (files: File[]) => uploadMedia(files, folder || undefined),
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

  const removeMutation = useMutation({
    mutationFn: (id: string) => removeMedia(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin', 'media'] }),
  });

  const handleDelete = async (id: string, name: string) => {
    const ok = await confirm({
      title: `ลบไฟล์ "${name}" ?`,
      message: 'หากไฟล์นี้ถูกใช้อยู่ที่อื่น ระบบจะปฏิเสธการลบ',
      danger: true,
      confirmLabel: 'ลบ',
    });
    if (!ok) return;
    try {
      await removeMutation.mutateAsync(id);
      toast.success('ลบไฟล์สำเร็จ');
    } catch (err) {
      toast.error(err instanceof ApiClientError ? err.message : 'ลบไม่สำเร็จ — ไฟล์นี้อาจถูกใช้งานอยู่');
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <SectionHeader
        title="คลังสื่อ"
        description="รูปภาพทั้งหมดที่อัปโหลดเข้าระบบ"
        action={
          <>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,image/gif,video/mp4,video/webm"
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
              size="sm"
              isLoading={uploadMutation.isPending}
              leftIcon={<UploadCloud className="size-4" aria-hidden />}
              onClick={() => fileInputRef.current?.click()}
            >
              อัปโหลดไฟล์
            </Button>
          </>
        }
      />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <SearchInput
          value={search}
          onChange={(v) => {
            setSearch(v);
            setPage(1);
          }}
          placeholder="ค้นหาชื่อไฟล์…"
          className="sm:max-w-xs"
        />
        {data && data.folders.length > 0 && (
          <select
            value={folder}
            onChange={(e) => {
              setFolder(e.target.value);
              setPage(1);
            }}
            className="glass rounded-sm px-3.5 py-2.5 text-sm text-ink outline-none focus:ring-2 focus:ring-brand-500"
          >
            <option value="">ทุกโฟลเดอร์</option>
            {data.folders.map((f) => (
              <option key={f.name} value={f.name}>
                {f.name} ({f.count})
              </option>
            ))}
          </select>
        )}
      </div>

      {isError && (
        <GlassCard padding="lg">
          <ErrorState onRetry={() => refetch()} />
        </GlassCard>
      )}

      {isLoading && (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 lg:grid-cols-6">
          {Array.from({ length: 12 }).map((_, i) => (
            <Skeleton key={i} className="aspect-square rounded-lg" />
          ))}
        </div>
      )}

      {!isLoading && !isError && (data?.items.length ?? 0) === 0 && (
        <GlassCard padding="lg">
          <EmptyState message="ยังไม่มีไฟล์ในคลัง — อัปโหลดไฟล์แรกได้จากปุ่มด้านบน" />
        </GlassCard>
      )}

      {!isLoading && data && data.items.length > 0 && (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 lg:grid-cols-6">
          {data.items.map((m) => (
            <div key={m.id} className="group relative aspect-square overflow-hidden rounded-lg border border-hairline/15">
              {isVideoMime(m.mimeType) ? (
                <video
                  src={resolveMediaUrl(m.url)}
                  muted
                  playsInline
                  preload="metadata"
                  className="size-full object-cover"
                />
              ) : (
                <img src={resolveMediaUrl(m.thumbnailUrl ?? m.url)} alt={m.alt ?? m.originalName} className="size-full object-cover" />
              )}
              <div className="absolute inset-x-0 bottom-0 truncate bg-black/60 px-2 py-1 text-[11px] text-white opacity-0 transition-opacity group-hover:opacity-100">
                {m.originalName} · {formatSize(m.size)}
              </div>
              <button
                onClick={() => handleDelete(m.id, m.originalName)}
                aria-label={`ลบ ${m.originalName}`}
                className="absolute right-1.5 top-1.5 grid size-7 place-items-center rounded-full bg-black/60 text-white opacity-0 transition-opacity hover:bg-danger group-hover:opacity-100"
              >
                <Trash2 className="size-3.5" aria-hidden />
              </button>
            </div>
          ))}
        </div>
      )}

      {data?.meta && <Pagination page={data.meta.page} totalPages={data.meta.totalPages} onChange={setPage} />}

      <ImageCropModal
        file={cropQueue.currentFile}
        open={!!cropQueue.currentFile}
        onCancel={cropQueue.skipCurrent}
        onConfirm={cropQueue.confirmCurrent}
      />
    </div>
  );
}
