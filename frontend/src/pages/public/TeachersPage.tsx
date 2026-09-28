import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getTeachers, getCategories } from '@/api/public';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { PageHero } from '@/components/common/PageHero';
import { ResultGrid } from '@/components/ResultGrid';
import { TeacherCard } from '@/components/cards';
import { cn } from '@/utils/cn';

/** หน้ารวมบุคลากร — กรองตามประเภทที่ผู้ดูแลระบบตั้งค่าไว้ (จัดการได้จากหน้า Admin) */
export default function TeachersPage() {
  useDocumentTitle('ครูและบุคลากร');
  const [tab, setTab] = useState<'ALL' | string>('ALL');

  const query = useQuery({ queryKey: ['teachers', 'all'], queryFn: () => getTeachers({ limit: 100 }) });
  const typesQuery = useQuery({
    queryKey: ['categories', 'teacher-types'],
    queryFn: () => getCategories({ type: 'TEACHER', limit: 100 }),
  });

  const tabs = [{ key: 'ALL', label: 'ทั้งหมด' }, ...(typesQuery.data?.items ?? []).map((t) => ({ key: t.id, label: t.name }))];

  const filtered = query.data
    ? { ...query.data, items: query.data.items.filter((t) => tab === 'ALL' || t.type?.id === tab) }
    : query.data;

  return (
    <>
      <PageHero
        title="ครูและบุคลากร"
        description="คณะครูและบุคลากรของแผนกวิชาเทคโนโลยีคอมพิวเตอร์"
        breadcrumb={[{ label: 'บุคลากร' }]}
      >
        <div className="glass inline-flex gap-1 rounded-lg p-1">
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={cn(
                'rounded-sm px-3.5 py-1.5 text-[13px] font-medium transition-colors',
                tab === t.key ? 'bg-gradient-to-br from-brand-400 to-brand-700 text-white shadow-glow' : 'text-ink-muted hover:text-brand-500',
              )}
            >
              {t.label}
            </button>
          ))}
        </div>
      </PageHero>

      <div className="mx-auto max-w-6xl px-4 py-12">
        <ResultGrid query={{ ...query, data: filtered } as typeof query} renderItem={(t) => <TeacherCard teacher={t} />} cols={4} emptyMessage="ไม่มีบุคลากรในกลุ่มนี้" />
      </div>
    </>
  );
}
