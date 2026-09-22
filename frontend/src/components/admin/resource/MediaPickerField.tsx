import { useEffect, useState } from 'react';
import { ImageOff } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { MediaPickerModal } from '../MediaPickerModal';
import { resolveMediaUrl, isVideoMime } from '@/utils/media';
import type { AdminMedia } from '@/types/adminContent';

export interface MediaPreview {
  id: string;
  url: string;
  thumbnailUrl?: string | null;
  mimeType?: string | null;
}

/**
 * เหมือน ImagePickerField แต่รับได้ทั้งรูปภาพ วิดีโอ และ GIF — แยกเป็นคอมโพเนนต์ต่างหาก
 * (ไม่ใช้ร่วมกับ ImagePickerField) เพื่อไม่ให้จุดที่ใช้รูปภาพอย่างเดียวอยู่แล้วมีพฤติกรรมเปลี่ยนไป
 */
export function MediaPickerField({
  value,
  initialPreview,
  onChange,
  accept = 'image/*,image/gif,video/mp4,video/webm',
}: {
  value?: string;
  initialPreview?: MediaPreview | null;
  onChange: (id: string | undefined) => void;
  accept?: string;
}) {
  const [preview, setPreview] = useState<MediaPreview | null>(initialPreview ?? null);
  const [pickerOpen, setPickerOpen] = useState(false);

  useEffect(() => {
    if (!value) setPreview(null);
  }, [value]);

  useEffect(() => {
    if (initialPreview) setPreview(initialPreview);
  }, [initialPreview]);

  const handleSelect = (media: AdminMedia) => {
    setPreview(media);
    onChange(media.id);
    setPickerOpen(false);
  };

  const isVideo = isVideoMime(preview?.mimeType);

  return (
    <div className="flex items-center gap-3">
      <div className="grid size-20 shrink-0 place-items-center overflow-hidden rounded-sm border border-hairline/20 bg-surface/60">
        {preview ? (
          isVideo ? (
            <video
              src={resolveMediaUrl(preview.url)}
              muted
              playsInline
              preload="metadata"
              className="size-full object-cover"
            />
          ) : (
            <img src={resolveMediaUrl(preview.thumbnailUrl ?? preview.url)} alt="" className="size-full object-cover" />
          )
        ) : (
          <ImageOff className="size-5 text-ink-subtle" aria-hidden />
        )}
      </div>
      <div className="flex flex-col items-start gap-1.5">
        <Button type="button" variant="outline" size="xs" onClick={() => setPickerOpen(true)}>
          {preview ? 'เปลี่ยนไฟล์' : 'เลือกรูปภาพหรือวิดีโอ'}
        </Button>
        {preview && (
          <button
            type="button"
            onClick={() => {
              setPreview(null);
              onChange(undefined);
            }}
            className="text-left text-xs text-danger hover:underline"
          >
            นำออก
          </button>
        )}
      </div>
      <MediaPickerModal open={pickerOpen} onClose={() => setPickerOpen(false)} onSelect={handleSelect} accept={accept} />
    </div>
  );
}
