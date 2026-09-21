import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { GlassCard } from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/Button';
import { ErrorState, Spinner } from '@/components/ui/feedback';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { listSettings } from '@/api/admin/settings';
import type { SiteSettings } from '@/types';
import { GeneralTab } from './GeneralTab';
import { AboutTab } from './AboutTab';
import { ContactTab } from './ContactTab';
import { SocialTab } from './SocialTab';
import { FooterTab } from './FooterTab';
import { SeoTab } from './SeoTab';

const TABS = [
  { key: 'general', label: 'ทั่วไป' },
  { key: 'about', label: 'เกี่ยวกับแผนก' },
  { key: 'contact', label: 'ติดต่อ' },
  { key: 'social', label: 'โซเชียลมีเดีย' },
  { key: 'footer', label: 'ท้ายเว็บไซต์' },
  { key: 'seo', label: 'SEO' },
] as const;
type TabKey = (typeof TABS)[number]['key'];

export function SettingsPage() {
  useDocumentTitle('ตั้งค่าเว็บไซต์');
  const [tab, setTab] = useState<TabKey>('general');

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['admin', 'settings', 'all'],
    queryFn: listSettings,
  });

  const settings: SiteSettings = Object.fromEntries((data ?? []).map((row) => [row.key, row.value])) as SiteSettings;

  return (
    <div className="flex flex-col gap-6">
      <SectionHeader title="ตั้งค่าเว็บไซต์" description="ข้อมูลเหล่านี้แสดงผลบนหน้าเว็บสาธารณะทันทีหลังบันทึก" />

      <div className="flex flex-wrap gap-2">
        {TABS.map((t) => (
          <Button key={t.key} size="sm" variant={tab === t.key ? 'primary' : 'outline'} onClick={() => setTab(t.key)}>
            {t.label}
          </Button>
        ))}
      </div>

      {isError && (
        <GlassCard padding="lg">
          <ErrorState onRetry={() => refetch()} />
        </GlassCard>
      )}
      {isLoading && (
        <GlassCard padding="lg">
          <Spinner />
        </GlassCard>
      )}

      {!isLoading && !isError && (
        <GlassCard padding="lg">
          {tab === 'general' && <GeneralTab value={settings.general} />}
          {tab === 'about' && <AboutTab value={settings.about} />}
          {tab === 'contact' && <ContactTab value={settings.contact} />}
          {tab === 'social' && <SocialTab value={settings.social} />}
          {tab === 'footer' && <FooterTab value={settings.footer} />}
          {tab === 'seo' && <SeoTab />}
        </GlassCard>
      )}
    </div>
  );
}
