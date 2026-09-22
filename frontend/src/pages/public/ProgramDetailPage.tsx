import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, CheckCircle2, Clock, Hash } from 'lucide-react';
import { getProgramByCode } from '@/api/public';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { MediaImage } from '@/components/ui/MediaImage';
import { GlassCard } from '@/components/ui/GlassCard';
import { DetailSkeleton, ErrorState } from '@/components/ui/feedback';
import { PageHero } from '@/components/common/PageHero';
import { PROGRAM_LEVEL_LABEL } from '@/utils/format';

/** หน้ารายละเอียดหลักสูตร — คำอธิบาย ทักษะที่ได้รับ และข้อมูลหลักสูตร */
export default function ProgramDetailPage() {
  const { code = '' } = useParams();
  const { data: program, isPending, isError, refetch } = useQuery({
    queryKey: ['program', code],
    queryFn: () => getProgramByCode(code),
    enabled: !!code,
  });
  useDocumentTitle(program?.name);

  if (isPending) return <DetailSkeleton sidebar />;
  if (isError || !program) {
    return <div className="mx-auto max-w-3xl px-4 py-20"><ErrorState onRetry={() => void refetch()} message="ไม่พบหลักสูตรที่ต้องการ" /></div>;
  }

  return (
    <>
      <PageHero
        title={program.name}
        description={program.nameEn ?? undefined}
        breadcrumb={[{ label: 'หลักสูตร', href: '/programs' }, { label: PROGRAM_LEVEL_LABEL[program.level] ?? 'รายละเอียด' }]}
      />
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-12 lg:grid-cols-[1.4fr_1fr]">
        <div>
          <div className="aspect-[16/9] overflow-hidden rounded-xl">
            <MediaImage media={program.image} alt={program.name} />
          </div>
          <h2 className="mt-8 font-display text-lg font-bold">เกี่ยวกับหลักสูตร</h2>
          <p className="mt-3 text-[15px] leading-loose text-ink-muted">{program.description}</p>

          <h2 className="mt-8 font-display text-lg font-bold">ทักษะที่ผู้เรียนจะได้รับ</h2>
          <ul className="mt-4 grid gap-3 sm:grid-cols-2">
            {program.skills.map((s) => (
              <li key={s} className="flex gap-2.5 text-[14px] text-ink-muted">
                <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-success" aria-hidden /> {s}
              </li>
            ))}
          </ul>

          <Link to="/programs" className="mt-10 inline-flex items-center gap-2 text-sm font-semibold text-brand-500 hover:gap-3">
            <ArrowLeft className="size-4" aria-hidden /> กลับไปหน้าหลักสูตรทั้งหมด
          </Link>
        </div>

        <aside>
          <GlassCard padding="lg" variant="strong" className="flex flex-col gap-4">
            <span className="inline-flex w-fit rounded-md bg-brand-500/[0.10] px-3 py-1 text-[13px] font-semibold text-brand-500">
              {PROGRAM_LEVEL_LABEL[program.level]}
            </span>
            <InfoRow icon={Hash} label="รหัสหลักสูตร" value={program.code} />
            <InfoRow icon={Clock} label="ระยะเวลาเรียน" value={program.duration} />
          </GlassCard>
        </aside>
      </div>
    </>
  );
}

function InfoRow({ icon: Icon, label, value }: { icon: typeof Hash; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3 border-t border-hairline/[0.13] pt-4 first:border-0 first:pt-0">
      <Icon className="size-4 text-brand-500" aria-hidden />
      <span className="text-[13px] text-ink-muted">{label}</span>
      <span className="ml-auto font-display text-sm font-semibold">{value}</span>
    </div>
  );
}
