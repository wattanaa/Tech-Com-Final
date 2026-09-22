import { useQuery } from '@tanstack/react-query';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import {
  Eye,
  FileText,
  FlaskConical,
  GraduationCap,
  Mail,
  Newspaper,
  Trophy,
  Users,
} from 'lucide-react';
import { getDashboardStats, type DashboardStats } from '@/api/admin/dashboard';
import { useAdminAuth } from '@/contexts/AdminAuthContext';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { GlassCard } from '@/components/ui/GlassCard';
import { Badge } from '@/components/ui/Badge';
import { StatCounter } from '@/components/ui/StatCounter';
import { ErrorState, Spinner } from '@/components/ui/feedback';
import { ACTION_LABEL, entityLabel } from '@/config/audit';

const STATUS_LABEL: Record<DashboardStats['recentNews'][number]['status'], string> = {
  DRAFT: 'ฉบับร่าง',
  REVIEW: 'รอตรวจ',
  APPROVED: 'อนุมัติแล้ว',
  PUBLISHED: 'เผยแพร่แล้ว',
  ARCHIVED: 'เก็บถาวร',
};

function StatCard({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Newspaper;
  label: string;
  value: number;
}) {
  return (
    <GlassCard padding="md" className="flex items-center gap-4">
      <div className="grid size-11 shrink-0 place-items-center rounded-full bg-brand-500/[0.10] text-brand-500">
        <Icon className="size-5" aria-hidden />
      </div>
      <div>
        <p className="font-display text-xl font-bold text-ink">
          <StatCounter value={value} />
        </p>
        <p className="text-xs text-ink-muted">{label}</p>
      </div>
    </GlassCard>
  );
}

export function DashboardPage() {
  useDocumentTitle('แดชบอร์ด');
  const { user } = useAdminAuth();

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['admin', 'dashboard', 'stats'],
    queryFn: getDashboardStats,
    staleTime: 60_000,
  });

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-display text-xl font-bold text-ink">สวัสดี, {user?.name}</h1>
        <p className="text-sm text-ink-muted">ภาพรวมของระบบ ณ ขณะนี้</p>
      </div>

      {isLoading && (
        <GlassCard padding="lg">
          <Spinner />
        </GlassCard>
      )}

      {isError && (
        <GlassCard padding="lg">
          <ErrorState onRetry={() => refetch()} />
        </GlassCard>
      )}

      {data && (
        <>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            <StatCard icon={Newspaper} label="ข่าวเผยแพร่แล้ว" value={data.cards.newsPublished} />
            <StatCard icon={FileText} label="ข่าวรอตรวจ" value={data.cards.newsPending} />
            <StatCard icon={GraduationCap} label="ครูและบุคลากร" value={data.cards.teachers} />
            <StatCard icon={Users} label="นักศึกษา" value={data.cards.students} />
            <StatCard icon={FlaskConical} label="กิจกรรม" value={data.cards.activities} />
            <StatCard icon={Trophy} label="ผลงานนักศึกษา" value={data.cards.projects} />
            <StatCard icon={Mail} label="ข้อความยังไม่อ่าน" value={data.cards.unreadMessages} />
            <StatCard icon={Eye} label="ยอดเข้าชมข่าวรวม" value={data.cards.totalViews} />
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <GlassCard padding="lg" className="lg:col-span-2">
              <p className="mb-4 font-display text-sm font-semibold text-ink">{data.chart.label}</p>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.chart.points}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgb(var(--c-hairline) / 0.15)" />
                    <XAxis dataKey="month" tick={{ fontSize: 11 }} stroke="rgb(var(--c-ink-subtle))" />
                    <YAxis allowDecimals={false} tick={{ fontSize: 11 }} stroke="rgb(var(--c-ink-subtle))" />
                    <Tooltip
                      contentStyle={{
                        background: 'rgb(var(--c-surface))',
                        border: '1px solid rgb(var(--c-hairline) / 0.2)',
                        borderRadius: 10,
                        fontSize: 12,
                      }}
                    />
                    <Bar dataKey="count" name="ข่าวที่เผยแพร่" fill="#0A84FF" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </GlassCard>

            <GlassCard padding="lg">
              <p className="mb-4 font-display text-sm font-semibold text-ink">สถานะระบบ</p>
              <dl className="flex flex-col gap-3 text-sm">
                <div className="flex items-center justify-between">
                  <dt className="text-ink-muted">ฐานข้อมูล</dt>
                  <dd>
                    {data.system.database.ok ? (
                      <Badge>เชื่อมต่อปกติ ({data.system.database.latencyMs}ms)</Badge>
                    ) : (
                      <Badge color="#DC2626">เชื่อมต่อไม่ได้</Badge>
                    )}
                  </dd>
                </div>
                <div className="flex items-center justify-between">
                  <dt className="text-ink-muted">เวลาทำงานเซิร์ฟเวอร์</dt>
                  <dd className="text-ink">{Math.floor(data.system.uptimeSeconds / 60)} นาที</dd>
                </div>
                <div className="flex items-center justify-between">
                  <dt className="text-ink-muted">หน่วยความจำที่ใช้</dt>
                  <dd className="text-ink">{data.system.memoryMb} MB</dd>
                </div>
              </dl>
            </GlassCard>
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <GlassCard padding="lg">
              <p className="mb-4 font-display text-sm font-semibold text-ink">ข่าวล่าสุด</p>
              {data.recentNews.length === 0 ? (
                <p className="text-sm text-ink-subtle">ยังไม่มีข่าว</p>
              ) : (
                <ul className="flex flex-col divide-y divide-hairline/10">
                  {data.recentNews.map((n) => (
                    <li key={n.id} className="flex items-center justify-between gap-3 py-2.5">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-ink">{n.title}</p>
                        <p className="text-xs text-ink-subtle">{n.author?.name ?? '—'}</p>
                      </div>
                      <Badge>{STATUS_LABEL[n.status]}</Badge>
                    </li>
                  ))}
                </ul>
              )}
            </GlassCard>

            <GlassCard padding="lg">
              <p className="mb-4 font-display text-sm font-semibold text-ink">กิจกรรมล่าสุดในระบบ</p>
              {data.recentActivity.length === 0 ? (
                <p className="text-sm text-ink-subtle">ยังไม่มีกิจกรรม</p>
              ) : (
                <ul className="flex flex-col divide-y divide-hairline/10">
                  {data.recentActivity.map((a) => (
                    <li key={a.id} className="flex items-center justify-between gap-3 py-2.5 text-sm">
                      <span className="text-ink">
                        {a.user?.name ?? 'ระบบ'} {ACTION_LABEL[a.action]}{ACTION_LABEL[a.action].endsWith('ระบบ') ? '' : `${entityLabel(a.entity)}`}
                      </span>
                      <span className="shrink-0 text-xs text-ink-subtle">
                        {new Date(a.createdAt).toLocaleString('th-TH', { dateStyle: 'short', timeStyle: 'short' })}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </GlassCard>
          </div>
        </>
      )}
    </div>
  );
}
