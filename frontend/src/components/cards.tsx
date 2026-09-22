import { Link } from 'react-router-dom';
import { Eye, Calendar, MapPin, Award, Cpu, Users, ArrowUpRight, Github, Pin } from 'lucide-react';
import type { Activity, Course, Facility, News, Program, Project, Teacher } from '@/types';
import { MediaImage } from './ui/MediaImage';
import { Badge } from './ui/Badge';
import { GlassCard } from './ui/GlassCard';
import { fullName, thaiDate, thaiNumber, PROGRAM_LEVEL_LABEL, TEACHER_TYPE_LABEL } from '@/utils/format';

/** ─────────────  ข่าว  ───────────── */
export function NewsCard({ news }: { news: News }) {
  return (
    <GlassCard as="article" padding="none" interactive className="group overflow-hidden">
      <Link to={`/news/${news.slug}`} className="block">
        <div className="relative aspect-[16/9] overflow-hidden">
          <MediaImage media={news.coverImage} alt={news.title} className="transition-transform duration-500 group-hover:scale-105" />
          {news.isPinned && (
            <span className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-md bg-warning/90 px-2 py-1 text-[10px] font-semibold text-white">
              <Pin className="size-3" aria-hidden /> ปักหมุด
            </span>
          )}
        </div>
        <div className="p-4">
          <div className="mb-2 flex items-center gap-2">
            {news.category && <Badge color={news.category.color}>{news.category.name}</Badge>}
            <span className="font-mono text-[11px] text-ink-subtle">{thaiDate(news.publishedAt ?? news.createdAt)}</span>
          </div>
          <h3 className="line-clamp-2 font-display text-[15px] font-semibold leading-relaxed group-hover:text-brand-500">
            {news.title}
          </h3>
          <p className="mt-2 line-clamp-2 text-[13px] text-ink-muted">{news.excerpt}</p>
          <div className="mt-3 flex items-center gap-1.5 border-t border-hairline/[0.13] pt-3 text-[11px] text-ink-subtle">
            <Eye className="size-3.5" aria-hidden /> {thaiNumber(news.views)} ครั้ง
          </div>
        </div>
      </Link>
    </GlassCard>
  );
}

/** ─────────────  บุคลากร  ───────────── */
export function TeacherCard({ teacher }: { teacher: Teacher }) {
  return (
    <GlassCard padding="none" interactive className="overflow-hidden text-center">
      <div className="relative aspect-[4/5] overflow-hidden">
        <MediaImage media={teacher.photo} alt={fullName(teacher)} />
        {teacher.type === 'HEAD' && (
          <span className="absolute left-3 top-3 rounded-md bg-brand-500/90 px-2 py-1 text-[10px] font-semibold text-white">
            {TEACHER_TYPE_LABEL[teacher.type]}
          </span>
        )}
      </div>
      <div className="p-4">
        <h3 className="font-display text-[15px] font-semibold">{fullName(teacher)}</h3>
        {teacher.academicRank && <p className="text-[12px] text-brand-500">{teacher.academicRank}</p>}
        <p className="mt-0.5 text-[12px] text-ink-muted">{teacher.position}</p>
        {teacher.specialties.length > 0 && (
          <div className="mt-3 flex flex-wrap justify-center gap-1.5">
            {teacher.specialties.slice(0, 3).map((s) => (
              <span key={s} className="rounded bg-brand-500/[0.08] px-2 py-0.5 text-[10.5px] text-ink-muted">{s}</span>
            ))}
          </div>
        )}
      </div>
    </GlassCard>
  );
}

/** ─────────────  ผลงานนักศึกษา  ───────────── */
export function ProjectCard({ project }: { project: Project }) {
  return (
    <GlassCard as="article" padding="none" interactive className="group overflow-hidden">
      <Link to={`/projects/${project.slug}`} className="block">
        <div className="relative aspect-[16/9] overflow-hidden">
          <MediaImage media={project.coverImage} alt={project.name} className="transition-transform duration-500 group-hover:scale-105" />
          {project.award && (
            <span className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-md bg-warning/90 px-2 py-1 text-[10px] font-semibold text-white">
              <Award className="size-3" aria-hidden /> ได้รางวัล
            </span>
          )}
        </div>
        <div className="p-4">
          <div className="mb-2 flex items-center gap-2">
            {project.category && <Badge color={project.category.color}>{project.category.name}</Badge>}
            <span className="font-mono text-[11px] text-ink-subtle">ปี {project.year + 543}</span>
          </div>
          <h3 className="line-clamp-2 font-display text-[15px] font-semibold group-hover:text-brand-500">{project.name}</h3>
          <p className="mt-2 line-clamp-2 text-[13px] text-ink-muted">{project.description}</p>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {project.technologies.slice(0, 4).map((t) => (
              <span key={t} className="rounded bg-brand-500/[0.08] px-2 py-0.5 font-mono text-[10px] text-brand-500">{t}</span>
            ))}
          </div>
        </div>
      </Link>
    </GlassCard>
  );
}

/** ─────────────  หลักสูตร  ───────────── */
export function ProgramCard({ program }: { program: Program }) {
  return (
    <GlassCard as="article" padding="none" interactive className="group overflow-hidden">
      <Link to={`/programs/${program.code}`} className="block">
        <div className="relative aspect-[16/9] overflow-hidden">
          <MediaImage media={program.image} alt={program.name} className="transition-transform duration-500 group-hover:scale-105" />
          <span className="absolute left-3 top-3 rounded-md bg-brand-500/90 px-2.5 py-1 text-[11px] font-semibold text-white">
            {PROGRAM_LEVEL_LABEL[program.level]}
          </span>
        </div>
        <div className="p-5">
          <h3 className="font-display text-base font-semibold group-hover:text-brand-500">{program.name}</h3>
          <p className="mt-2 line-clamp-2 text-[13px] text-ink-muted">{program.description}</p>
          <div className="mt-3 flex items-center gap-2 border-t border-hairline/[0.13] pt-3 text-[12px] text-ink-subtle">
            <span className="font-mono">{program.code}</span> · <span>{program.duration}</span>
            <ArrowUpRight className="ml-auto size-4 text-brand-500 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" aria-hidden />
          </div>
        </div>
      </Link>
    </GlassCard>
  );
}

/** ─────────────  รายวิชา  ───────────── */
export function CourseCard({ course }: { course: Course }) {
  return (
    <GlassCard padding="md" className="flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <span className="grid size-9 shrink-0 place-items-center rounded-sm bg-brand-500/[0.10] text-brand-500">
          <Cpu className="size-4" aria-hidden />
        </span>
        <span className="font-mono text-[12px] text-ink-subtle">{course.code}</span>
        {course.program && (
          <span className="ml-auto rounded bg-brand-500/[0.08] px-2 py-0.5 text-[10.5px] text-brand-500">
            {PROGRAM_LEVEL_LABEL[course.program.level]}
          </span>
        )}
      </div>
      <h3 className="font-display text-[15px] font-semibold leading-relaxed">{course.name}</h3>
      <p className="line-clamp-2 text-[13px] text-ink-muted">{course.description}</p>
      <div className="mt-1 flex gap-4 border-t border-hairline/[0.13] pt-2.5 font-mono text-[11px] text-ink-subtle">
        <span>{course.credits} หน่วยกิต</span>
        <span>{course.hours} ชม./สัปดาห์</span>
      </div>
    </GlassCard>
  );
}

/** ─────────────  กิจกรรม  ───────────── */
export function ActivityCard({ activity }: { activity: Activity }) {
  return (
    <GlassCard as="article" padding="none" interactive className="group overflow-hidden">
      <Link to={`/activities/${activity.slug}`} className="flex gap-0">
        <div className="relative w-28 shrink-0 overflow-hidden sm:w-36">
          <MediaImage media={activity.coverImage} alt={activity.title} className="h-full transition-transform duration-500 group-hover:scale-105" />
        </div>
        <div className="min-w-0 flex-1 p-4">
          {activity.category && <Badge color={activity.category.color} className="mb-2">{activity.category.name}</Badge>}
          <h3 className="line-clamp-2 font-display text-[14px] font-semibold group-hover:text-brand-500">{activity.title}</h3>
          <div className="mt-2 flex flex-wrap gap-3 text-[11.5px] text-ink-subtle">
            <span className="inline-flex items-center gap-1"><Calendar className="size-3.5" aria-hidden /> {thaiDate(activity.startDate)}</span>
            {activity.location && <span className="inline-flex items-center gap-1"><MapPin className="size-3.5" aria-hidden /> {activity.location}</span>}
          </div>
        </div>
      </Link>
    </GlassCard>
  );
}

/** ─────────────  ห้องปฏิบัติการ  ───────────── */
export function FacilityCard({ facility }: { facility: Facility }) {
  return (
    <GlassCard as="article" padding="none" interactive className="group overflow-hidden">
      <Link to={`/facilities/${facility.slug}`} className="block">
        <div className="relative aspect-[16/10] overflow-hidden">
          <MediaImage media={facility.coverImage} alt={facility.name} className="transition-transform duration-500 group-hover:scale-105" />
          <span className="absolute bottom-3 left-3 inline-flex items-center gap-1.5 rounded-md bg-black/40 px-2.5 py-1 text-[11px] font-medium text-white backdrop-blur">
            <Users className="size-3.5" aria-hidden /> {facility.computerCount} เครื่อง
          </span>
        </div>
        <div className="p-4">
          <h3 className="font-display text-[15px] font-semibold group-hover:text-brand-500">{facility.name}</h3>
          <p className="mt-1.5 line-clamp-2 text-[13px] text-ink-muted">{facility.description}</p>
        </div>
      </Link>
    </GlassCard>
  );
}

export { Github };
