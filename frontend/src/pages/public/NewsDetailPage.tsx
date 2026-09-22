import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Calendar, Eye, User } from 'lucide-react';
import { getNews, getNewsBySlug } from '@/api/public';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { MediaImage } from '@/components/ui/MediaImage';
import { Badge } from '@/components/ui/Badge';
import { DetailSkeleton, ErrorState } from '@/components/ui/feedback';
import { NewsCard } from '@/components/cards';
import { PageHero } from '@/components/common/PageHero';
import { thaiDate, thaiNumber } from '@/utils/format';

/** หน้ารายละเอียดข่าว — เนื้อหาเต็ม + ข่าวที่เกี่ยวข้อง */
export default function NewsDetailPage() {
  const { slug = '' } = useParams();
  const { data: news, isPending, isError, refetch } = useQuery({
    queryKey: ['news', slug],
    queryFn: () => getNewsBySlug(slug),
    enabled: !!slug,
  });
  useDocumentTitle(news?.title);

  const related = useQuery({
    queryKey: ['news', 'related'],
    queryFn: () => getNews({ limit: 3, sortBy: 'publishedAt', order: 'desc' }),
    enabled: !!news,
  });

  if (isPending) return <DetailSkeleton />;
  if (isError || !news) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-20">
        <ErrorState onRetry={() => void refetch()} message="ไม่พบข่าวที่ต้องการ" />
      </div>
    );
  }

  return (
    <>
      <PageHero title={news.title} breadcrumb={[{ label: 'ข่าวสาร', href: '/news' }, { label: 'รายละเอียด' }]}>
        <div className="flex flex-wrap items-center gap-4 text-[13px] text-ink-muted">
          {news.category && <Badge color={news.category.color}>{news.category.name}</Badge>}
          <span className="inline-flex items-center gap-1.5"><Calendar className="size-4" aria-hidden /> {thaiDate(news.publishedAt ?? news.createdAt, true)}</span>
          {news.author && <span className="inline-flex items-center gap-1.5"><User className="size-4" aria-hidden /> {news.author.name}</span>}
          <span className="inline-flex items-center gap-1.5"><Eye className="size-4" aria-hidden /> {thaiNumber(news.views)} ครั้ง</span>
        </div>
      </PageHero>

      <article className="mx-auto max-w-3xl px-4 py-12">
        <div className="aspect-[16/9] overflow-hidden rounded-xl">
          <MediaImage media={news.coverImage} alt={news.title} />
        </div>
        <div className="mt-8 flex flex-col gap-4 text-[15.5px] leading-loose text-ink/90">
          {news.content.split('\n').filter(Boolean).map((para, i) => (
            <p key={i}>{para}</p>
          ))}
        </div>
        <div className="mt-10 border-t border-hairline/[0.13] pt-6">
          <Link to="/news" className="inline-flex items-center gap-2 text-sm font-semibold text-brand-500 hover:gap-3">
            <ArrowLeft className="size-4" aria-hidden /> กลับไปหน้าข่าวทั้งหมด
          </Link>
        </div>
      </article>

      {related.data && related.data.items.filter((n) => n.slug !== slug).length > 0 && (
        <section className="border-t border-hairline/[0.13] bg-surface/40">
          <div className="mx-auto max-w-6xl px-4 py-14">
            <h2 className="mb-6 font-display text-xl font-bold">ข่าวที่เกี่ยวข้อง</h2>
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {related.data.items.filter((n) => n.slug !== slug).slice(0, 3).map((n) => (
                <NewsCard key={n.id} news={n} />
              ))}
            </div>
          </div>
        </section>
      )}
    </>
  );
}
