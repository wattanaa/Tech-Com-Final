import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import type { GalleryImage } from '@/types';
import { getAlbums } from '@/api/public';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { PageHero } from '@/components/common/PageHero';
import { MediaImage } from '@/components/ui/MediaImage';
import { Lightbox } from '@/components/ui/Lightbox';
import { SkeletonGrid, ErrorState, EmptyState } from '@/components/ui/feedback';
import { Reveal } from '@/components/ui/Reveal';
import { thaiDate } from '@/utils/format';

/** หน้าคลังภาพ — แยกตามอัลบั้ม เปิดดูภาพขยายได้ */
export default function GalleryPage() {
  useDocumentTitle('คลังภาพ');
  const { data, isPending, isError, refetch } = useQuery({ queryKey: ['albums'], queryFn: getAlbums, staleTime: 5 * 60_000 });
  const [active, setActive] = useState<number | null>(null);

  // รวมภาพทุกอัลบั้มไว้ในอาเรย์เดียวสำหรับ lightbox พร้อมจดจำ index เริ่มของแต่ละอัลบั้ม
  const { flat, offsets } = useMemo(() => {
    const flat: GalleryImage[] = [];
    const offsets: number[] = [];
    for (const album of data ?? []) {
      offsets.push(flat.length);
      flat.push(...album.images);
    }
    return { flat, offsets };
  }, [data]);

  return (
    <>
      <PageHero
        title="คลังภาพกิจกรรม"
        description="ภาพบรรยากาศกิจกรรมต่าง ๆ ของแผนกวิชาเทคโนโลยีคอมพิวเตอร์"
        breadcrumb={[{ label: 'คลังภาพ' }]}
      />
      <div className="mx-auto max-w-6xl px-4 py-12">
        {isPending && <SkeletonGrid count={8} cols={4} />}
        {isError && <ErrorState onRetry={() => void refetch()} />}
        {data && data.length === 0 && <EmptyState message="ยังไม่มีอัลบั้มภาพ" />}
        <div className="flex flex-col gap-12">
          {data?.map((album, ai) => (
            <section key={album.id}>
              <div className="mb-4 flex items-end justify-between gap-3">
                <div>
                  <h2 className="font-display text-lg font-bold">{album.name}</h2>
                  {album.description && <p className="mt-1 text-[13px] text-ink-muted">{album.description}</p>}
                </div>
                {album.eventDate && <span className="font-mono text-[12px] text-ink-subtle">{thaiDate(album.eventDate)}</span>}
              </div>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                {album.images.map((img, i) => (
                  <Reveal key={img.id} delay={Math.min(i * 0.03, 0.2)}>
                    <button
                      onClick={() => setActive((offsets[ai] ?? 0) + i)}
                      className="group block aspect-square w-full overflow-hidden rounded-lg"
                      aria-label={img.caption ?? 'เปิดดูภาพ'}
                    >
                      <MediaImage media={img.media} alt={img.caption ?? album.name} thumb className="transition-transform duration-500 group-hover:scale-110" />
                    </button>
                  </Reveal>
                ))}
              </div>
            </section>
          ))}
        </div>
      </div>
      <Lightbox images={flat} index={active} onClose={() => setActive(null)} onNavigate={setActive} />
    </>
  );
}
