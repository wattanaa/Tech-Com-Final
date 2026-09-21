import { useEffect, useState } from 'react';
import { ImageOff } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { MediaPickerModal } from '../MediaPickerModal';
import type { AdminMedia } from '@/types/adminContent';

export interface ImagePreview {
  id: string;
  url: string;
  thumbnailUrl?: string | null;
}

/** ฟิลด์เลือกรูปภาพ 1 รูป — เก็บค่าเป็น media id ในฟอร์ม แต่แสดงตัวอย่างภาพให้เห็นด้วย */
export function ImagePickerField({
  value,
  initialPreview,
  onChange,
}: {
  value?: string;
  initialPreview?: ImagePreview | null;
  onChange: (id: string | undefined) => void;
}) {
  const [preview, setPreview] = useState<ImagePreview | null>(initialPreview ?? null);
  const [pickerOpen, setPickerOpen] = useState(false);

  useEffect(() => {
    if (!value) setPreview(null);
  }, [value]);

  const handleSelect = (media: AdminMedia) => {
    setPreview(media);
    onChange(media.id);
    setPickerOpen(false);
  };

  return (
    <div className="flex items-center gap-3">
      <div className="grid size-20 shrink-0 place-items-center overflow-hidden rounded-sm border border-hairline/20 bg-surface/60">
        {preview ? (
          <img src={preview.thumbnailUrl ?? preview.url} alt="" className="size-full object-cover" />
        ) : (
          <ImageOff className="size-5 text-ink-subtle" aria-hidden />
        )}
      </div>
      <div className="flex flex-col items-start gap-1.5">
        <Button type="button" variant="outline" size="xs" onClick={() => setPickerOpen(true)}>
          {preview ? 'เปลี่ยนรูปภาพ' : 'เลือกรูปภาพ'}
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
            นำรูปออก
          </button>
        )}
      </div>
      <MediaPickerModal open={pickerOpen} onClose={() => setPickerOpen(false)} onSelect={handleSelect} />
    </div>
  );
}
