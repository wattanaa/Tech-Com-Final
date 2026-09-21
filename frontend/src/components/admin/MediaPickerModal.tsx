import { useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { UploadCloud } from 'lucide-react';
import { Modal } from './Modal';
import { useToast } from './Toast';
import { SearchInput } from '@/components/ui/SearchInput';
import { Pagination } from '@/components/ui/Pagination';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/feedback';
import { useDebounce } from '@/hooks/useDebounce';
import { listMedia, uploadMedia } from '@/api/admin/media';
import { ApiClientError } from '@/api/client';
import type { AdminMedia } from '@/types/adminContent';

/** กล่องเลือกรูปภาพจากคลังสื่อ — ใช้ซ้ำได้จากทุก field รูปภาพในฟอร์มหลังบ้าน */
export function MediaPickerModal({
  open,
  onClose,
  onSelect,
}: {
  open: boolean;
  onClose: () => void;
  onSelect: (media: AdminMedia) => void;
}) {
  const toast = useToast();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const debouncedSearch = useDebounce(search);

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
            accept="image/*"
            multiple
            hidden
            onChange={(e) => {
              const files = Array.from(e.target.files ?? []);
              if (files.length > 0) uploadMutation.mutate(files);
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

        {isLoading ? (
          <Spinner />
        ) : (
          <div className="grid max-h-[50vh] min-h-[200px] grid-cols-3 gap-3 overflow-y-auto sm:grid-cols-4">
            {(data?.items ?? []).map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => onSelect(m)}
                className="group aspect-square overflow-hidden rounded-sm border border-hairline/20 transition-colors hover:border-brand-500"
                title={m.originalName}
              >
                <img src={m.thumbnailUrl ?? m.url} alt={m.alt ?? ''} className="size-full object-cover transition-transform group-hover:scale-105" />
              </button>
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
    </Modal>
  );
}
