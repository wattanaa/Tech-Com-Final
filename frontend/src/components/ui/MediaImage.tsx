import { useState } from 'react';
import { ImageOff } from 'lucide-react';
import type { Media } from '@/types';
import { cn } from '@/utils/cn';
import { resolveMediaUrl } from '@/utils/media';

/**
 * แสดงรูปจาก Media พร้อม lazy loading และ fallback เป็นพื้นไล่สีน้ำเงินเมื่อไม่มีรูป
 * ป้องกัน layout shift ด้วย aspect-ratio ที่กำหนดจากภายนอก
 */
export function MediaImage({
  media,
  alt,
  className,
  thumb = false,
}: {
  media?: Media | null;
  alt: string;
  className?: string;
  /** ใช้ thumbnail แทนภาพเต็มเมื่อเป็นภาพเล็ก */
  thumb?: boolean;
}) {
  const [failed, setFailed] = useState(false);
  const src = resolveMediaUrl(thumb ? media?.thumbnailUrl ?? media?.url : media?.url);

  if (!src || failed) {
    return (
      <div
        className={cn(
          'grid place-items-center bg-gradient-to-br from-brand-400/90 to-brand-700 text-white/70',
          className,
        )}
        role="img"
        aria-label={alt}
      >
        <ImageOff className="size-8" aria-hidden />
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={media?.alt || alt}
      loading="lazy"
      decoding="async"
      onError={() => setFailed(true)}
      className={cn('h-full w-full object-cover', className)}
    />
  );
}
