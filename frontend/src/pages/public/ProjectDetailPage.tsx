import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Award, ExternalLink, Github, Users } from 'lucide-react';
import { getProjectBySlug } from '@/api/public';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { MediaImage } from '@/components/ui/MediaImage';
import { Badge } from '@/components/ui/Badge';
import { GlassCard } from '@/components/ui/GlassCard';
import { DetailSkeleton, ErrorState } from '@/components/ui/feedback';
import { PageHero } from '@/components/common/PageHero';
import { fullName } from '@/utils/format';

/** หน้ารายละเอียดผลงานนักศึกษา — รายละเอียด ทีม เทคโนโลยี และลิงก์ */
export default function ProjectDetailPage() {
  const { slug = '' } = useParams();
  const { data: project, isPending, isError, refetch } = useQuery({
    queryKey: ['project', slug],
    queryFn: () => getProjectBySlug(slug),
    enabled: !!slug,
  });
  useDocumentTitle(project?.name);

  if (isPending) return <DetailSkeleton />;
  if (isError || !project) {
    return <div className="mx-auto max-w-3xl px-4 py-20"><ErrorState onRetry={() => void refetch()} message="ไม่พบผลงานที่ต้องการ" /></div>;
  }

  return (
    <>
      <PageHero title={project.name} breadcrumb={[{ label: 'ผลงาน', href: '/projects' }, { label: 'รายละเอียด' }]}>
        <div className="flex flex-wrap items-center gap-3 text-[13px] text-ink-muted">
          {project.category && <Badge color={project.category.color}>{project.category.name}</Badge>}
          <span className="font-mono">ปีการศึกษา {project.year + 543}</span>
        </div>
      </PageHero>

      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-12 lg:grid-cols-[1.5fr_1fr]">
        <div>
          <div className="aspect-[16/9] overflow-hidden rounded-xl">
            <MediaImage media={project.coverImage} alt={project.name} />
          </div>
          <h2 className="mt-8 font-display text-lg font-bold">รายละเอียดผลงาน</h2>
          <p className="mt-3 text-[15px] leading-loose text-ink-muted">{project.description}</p>
          <Link to="/projects" className="mt-8 inline-flex items-center gap-2 text-sm font-semibold text-brand-500 hover:gap-3">
            <ArrowLeft className="size-4" aria-hidden /> กลับไปหน้าผลงานทั้งหมด
          </Link>
        </div>

        <aside className="flex flex-col gap-5">
          {project.award && (
            <GlassCard padding="md" className="flex items-start gap-3">
              <Award className="mt-0.5 size-5 shrink-0 text-warning" aria-hidden />
              <div>
                <p className="font-display text-sm font-semibold">รางวัลที่ได้รับ</p>
                <p className="mt-1 text-[13px] text-ink-muted">{project.award}</p>
              </div>
            </GlassCard>
          )}

          <GlassCard padding="md">
            <h3 className="font-display text-sm font-semibold">เทคโนโลยีที่ใช้</h3>
            <div className="mt-3 flex flex-wrap gap-2">
              {project.technologies.map((t) => (
                <span key={t} className="rounded-sm bg-brand-500/[0.08] px-2.5 py-1 font-mono text-[11.5px] text-brand-500">{t}</span>
              ))}
            </div>
          </GlassCard>

          {project.members && project.members.length > 0 && (
            <GlassCard padding="md">
              <h3 className="flex items-center gap-2 font-display text-sm font-semibold"><Users className="size-4 text-brand-500" aria-hidden /> ทีมพัฒนา</h3>
              <ul className="mt-3 flex flex-col gap-2">
                {project.members.map((m, i) => (
                  <li key={i} className="flex items-center justify-between text-[13px]">
                    <span>{fullName(m.student)}</span>
                    {m.role && <span className="text-[11px] text-ink-subtle">{m.role}</span>}
                  </li>
                ))}
              </ul>
            </GlassCard>
          )}

          {project.advisor && (
            <GlassCard padding="md">
              <h3 className="font-display text-sm font-semibold">ครูที่ปรึกษา</h3>
              <p className="mt-1.5 text-[13px] text-ink-muted">{fullName(project.advisor)}</p>
            </GlassCard>
          )}

          {(project.demoUrl || project.githubUrl) && (
            <div className="flex flex-col gap-2.5">
              {project.demoUrl && (
                <a href={project.demoUrl} target="_blank" rel="noopener noreferrer"
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-gradient-to-br from-brand-400 to-brand-700 px-4 text-sm font-semibold text-white shadow-glow">
                  <ExternalLink className="size-4" aria-hidden /> ดูตัวอย่างผลงาน
                </a>
              )}
              {project.githubUrl && (
                <a href={project.githubUrl} target="_blank" rel="noopener noreferrer"
                  className="glass inline-flex h-11 items-center justify-center gap-2 rounded-lg px-4 text-sm font-semibold text-ink hover:border-hairline/30">
                  <Github className="size-4" aria-hidden /> ซอร์สโค้ด
                </a>
              )}
            </div>
          )}
        </aside>
      </div>
    </>
  );
}
