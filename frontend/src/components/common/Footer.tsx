import { Link } from 'react-router-dom';
import { Cpu, Facebook, Youtube, MapPin, Phone, Mail } from 'lucide-react';
import { useSettings } from '@/hooks/useSiteData';
import { COLLEGE_NAME, SITE_NAME } from '@/constants/site';
import { resolveMediaUrl } from '@/utils/media';

/** ส่วนท้ายเว็บไซต์ — เนื้อหาทั้งหมดอ่านจากการตั้งค่าที่แก้ได้ในระบบหลังบ้าน */
export function Footer() {
  const settings = useSettings();
  const footer = settings.footer ?? {};
  const contact = settings.contact ?? {};
  const social = settings.social ?? {};
  const logo = settings.general?.logo;

  const quickLinks = footer.quickLinks ?? [
    { label: 'หลักสูตร', href: '/programs' },
    { label: 'ข่าวสาร', href: '/news' },
    { label: 'ผลงานนักศึกษา', href: '/projects' },
    { label: 'ติดต่อ', href: '/contact' },
  ];

  return (
    <footer className="mt-20 border-t border-hairline/[0.13] bg-surface/40">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-14 sm:grid-cols-2 lg:grid-cols-4">
        <div className="lg:col-span-2">
          <div className="flex items-center gap-2.5">
            {logo ? (
              <img src={resolveMediaUrl(logo.thumbnailUrl ?? logo.url)} alt={logo.alt ?? SITE_NAME} className="size-10 shrink-0 rounded-sm object-contain" />
            ) : (
              <span className="grid size-10 place-items-center rounded-sm bg-gradient-to-br from-brand-400 to-brand-700 text-white shadow-glow">
                <Cpu className="size-5" aria-hidden />
              </span>
            )}
            <span className="leading-tight">
              <span className="block font-display text-sm font-bold">แผนกวิชา{SITE_NAME}</span>
              <span className="block text-xs text-ink-subtle">{COLLEGE_NAME}</span>
            </span>
          </div>
          <p className="mt-4 max-w-md text-[13px] leading-relaxed text-ink-muted">
            {footer.description ??
              'แผนกวิชาเทคโนโลยีคอมพิวเตอร์ มุ่งผลิตช่างเทคนิคและนักเทคโนโลยีที่มีสมรรถนะวิชาชีพตรงตามความต้องการของสถานประกอบการ'}
          </p>
          <div className="mt-5 flex gap-2.5">
            {social.facebook && <SocialLink href={social.facebook} label="Facebook"><Facebook className="size-[18px]" aria-hidden /></SocialLink>}
            {social.youtube && <SocialLink href={social.youtube} label="YouTube"><Youtube className="size-[18px]" aria-hidden /></SocialLink>}
          </div>
        </div>

        <div>
          <h3 className="font-display text-[13px] font-semibold uppercase tracking-wide text-ink-subtle">ลิงก์ด่วน</h3>
          <ul className="mt-4 flex flex-col gap-2.5 text-[13px] text-ink-muted">
            {quickLinks.map((l) => (
              <li key={l.href}><Link to={l.href} className="hover:text-brand-500">{l.label}</Link></li>
            ))}
          </ul>
        </div>

        <div>
          <h3 className="font-display text-[13px] font-semibold uppercase tracking-wide text-ink-subtle">ติดต่อ</h3>
          <ul className="mt-4 flex flex-col gap-3 text-[13px] text-ink-muted">
            {contact.address && (
              <li className="flex gap-2.5"><MapPin className="mt-0.5 size-4 shrink-0 text-brand-500" aria-hidden /> {contact.address}</li>
            )}
            {contact.phone && (
              <li className="flex gap-2.5"><Phone className="size-4 shrink-0 text-brand-500" aria-hidden /> {contact.phone}</li>
            )}
            {contact.email && (
              <li className="flex gap-2.5"><Mail className="size-4 shrink-0 text-brand-500" aria-hidden /> {contact.email}</li>
            )}
          </ul>
        </div>
      </div>

      <div className="border-t border-hairline/[0.13] py-5">
        <p className="mx-auto max-w-6xl px-4 text-center text-xs text-ink-subtle">
          {footer.copyright ?? `© ${new Date().getFullYear() + 543} แผนกวิชา${SITE_NAME} ${COLLEGE_NAME}`}
        </p>
      </div>
    </footer>
  );
}

function SocialLink({ href, label, children }: { href: string; label: string; children: React.ReactNode }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={label}
      className="grid size-9 place-items-center rounded-sm border border-hairline/15 text-ink-muted transition-colors hover:border-brand-500/40 hover:text-brand-500"
    >
      {children}
    </a>
  );
}
