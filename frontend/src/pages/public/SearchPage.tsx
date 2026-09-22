import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowUpRight, SearchX } from 'lucide-react';
import { search as searchApi } from '@/api/public';
import { useDebounce } from '@/hooks/useDebounce';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { PageHero } from '@/components/common/PageHero';
import { SearchInput } from '@/components/ui/SearchInput';
import { GlassCard } from '@/components/ui/GlassCard';
import { SkeletonList, EmptyState } from '@/components/ui/feedback';
import { Badge } from '@/components/ui/Badge';

/** หน้าค้นหาทั่วเว็บไซต์ — ผลลัพธ์จัดกลุ่มตามประเภทเนื้อหา */
export default function SearchPage() {
  useDocumentTitle('ค้นหา');
  const [params, setParams] = useSearchParams();
  const [term, setTerm] = useState(params.get('q') ?? '');
  const debounced = useDebounce(term, 400);

  useEffect(() => {
    setParams(debounced ? { q: debounced } : {}, { replace: true });
  }, [debounced, setParams]);

  const query = useQuery({
    queryKey: ['search', debounced],
    queryFn: () => searchApi(debounced),
    enabled: debounced.trim().length >= 2,
  });

  return (
    <>
      <PageHero title="ค้นหา" breadcrumb={[{ label: 'ค้นหา' }]}>
        <SearchInput value={term} onChange={setTerm} placeholder="ค้นหาข่าว กิจกรรม ผลงาน รายวิชา บุคลากร…" className="max-w-xl" autoFocus />
      </PageHero>

      <div className="mx-auto max-w-4xl px-4 py-12">
        {debounced.trim().length < 2 && (
          <EmptyState title="พิมพ์คำค้นหา" message="กรอกอย่างน้อย 2 ตัวอักษรเพื่อค้นหาทั่วทั้งเว็บไซต์" icon={<SearchX className="size-6" aria-hidden />} />
        )}
        {query.isPending && debounced.trim().length >= 2 && <SkeletonList count={5} />}
        {query.data && query.data.total === 0 && (
          <EmptyState title="ไม่พบผลลัพธ์" message={`ไม่พบเนื้อหาที่ตรงกับ “${debounced}”`} icon={<SearchX className="size-6" aria-hidden />} />
        )}
        {query.data && query.data.total > 0 && (
          <div className="flex flex-col gap-8">
            <p className="text-sm text-ink-muted">พบ {query.data.total} รายการที่ตรงกับ “{debounced}”</p>
            {query.data.groups.filter((g) => g.count > 0).map((group) => (
              <section key={group.type}>
                <div className="mb-3 flex items-center gap-2">
                  <h2 className="font-display text-base font-bold">{group.label}</h2>
                  <Badge>{group.count}</Badge>
                </div>
                <div className="flex flex-col gap-2.5">
                  {group.items.map((item) => (
                    <GlassCard key={item.id} as="div" padding="none" interactive>
                      <Link to={item.href} className="flex items-center gap-3 p-4">
                        <div className="min-w-0 flex-1">
                          <p className="truncate font-display text-[14px] font-semibold">{item.title}</p>
                          {item.subtitle && <p className="truncate text-[12.5px] text-ink-muted">{item.subtitle}</p>}
                        </div>
                        <ArrowUpRight className="size-4 shrink-0 text-brand-500" aria-hidden />
                      </Link>
                    </GlassCard>
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
