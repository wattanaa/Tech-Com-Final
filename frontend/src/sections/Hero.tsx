import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { ArrowRight, Cpu, GraduationCap, Sparkles } from 'lucide-react';
import type { HomepageSection } from '@/types';
import { fadeUp, stagger } from '@/animations/variants';
import { resolveMediaUrl, isVideoMime, isYoutubeMedia, getYoutubeEmbedUrl } from '@/utils/media';
import { useReducedMotion } from '@/hooks/useReducedMotion';

interface HeroConfig {
  badge?: string;
  heading?: string;
  subheading?: string;
  primaryCta?: { label: string; href: string };
  secondaryCta?: { label: string; href: string };
  showGrid?: boolean;
  showGlow?: boolean;
  /** เติมโดย backend จาก backgroundImageId (ดู withHeroBackgroundMedia ใน homepage.routes.ts) */
  backgroundMedia?: { url: string; mimeType: string } | null;
  statCardTitle?: string;
  statCardSubtitle?: string;
  awardCardTitle?: string;
  awardCardNumber?: string;
  awardCardSuffix?: string;
}

/** ส่วนหัวหน้าแรก — ข้อความหลัก ปุ่มเรียกดำเนินการ และภาพประกอบกระจกลอย */
export function HeroSection({ section }: { section: HomepageSection }) {
  const c = section.config as HeroConfig;
  const heading = c.heading ?? 'สร้างทักษะดิจิทัล สร้างนวัตกรรม สร้างอนาคต';
  const primary = c.primaryCta ?? { label: 'ดูหลักสูตร', href: '/programs' };
  const secondary = c.secondaryCta ?? { label: 'เกี่ยวกับแผนก', href: '/about' };
  const statCardTitle = c.statCardTitle || 'ผู้สำเร็จการศึกษา';
  const statCardSubtitle = c.statCardSubtitle || 'ย้อนหลัง 6 ปีการศึกษา';
  const awardCardTitle = c.awardCardTitle || 'รางวัลระดับชาติ';
  const awardCardNumber = c.awardCardNumber || '18';
  const awardCardSuffix = c.awardCardSuffix || '+3';
  const reducedMotion = useReducedMotion();
  const bgIsYoutube = isYoutubeMedia(c.backgroundMedia?.mimeType);
  const bgYoutubeEmbed =
    bgIsYoutube && c.backgroundMedia?.url ? getYoutubeEmbedUrl(c.backgroundMedia.url, { background: !reducedMotion }) : null;
  const bgSrc = bgIsYoutube ? null : resolveMediaUrl(c.backgroundMedia?.url);
  const bgIsVideo = isVideoMime(c.backgroundMedia?.mimeType);
  const hasBackground = Boolean(bgSrc || bgYoutubeEmbed);

  return (
    <section className={`relative overflow-hidden ${hasBackground ? 'min-h-[420px]' : ''}`}>
      {bgYoutubeEmbed && (
        <div className="absolute inset-0 overflow-hidden" aria-hidden>
          {/* วาง iframe เกินขนาดแล้วครอปด้วย overflow-hidden — เลียนแบบ object-fit:cover ที่ iframe ทำเองไม่ได้ */}
          <iframe
            src={bgYoutubeEmbed}
            title=""
            allow="autoplay; encrypted-media"
            className="pointer-events-none absolute left-1/2 top-1/2 h-[56.25vw] min-h-full w-[177.78vh] min-w-full -translate-x-1/2 -translate-y-1/2"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-canvas/70 via-canvas/60 to-canvas" />
        </div>
      )}
      {bgSrc && (
        <div className="absolute inset-0" aria-hidden>
          {bgIsVideo ? (
            <video
              src={bgSrc}
              autoPlay={!reducedMotion}
              loop={!reducedMotion}
              muted
              playsInline
              className="size-full object-cover"
            />
          ) : (
            <img src={bgSrc} alt="" className="size-full object-cover" />
          )}
          {/* พื้นหลังมืดไล่สี — ให้ตัวอักษรอ่านง่ายขึ้นเมื่อทับบนภาพ/วิดีโอ */}
          <div className="absolute inset-0 bg-gradient-to-b from-canvas/70 via-canvas/60 to-canvas" />
        </div>
      )}
      {c.showGrid !== false && (
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            backgroundImage:
              'linear-gradient(rgb(var(--c-border) / 0.13) 1px, transparent 1px), linear-gradient(90deg, rgb(var(--c-border) / 0.13) 1px, transparent 1px)',
            backgroundSize: '46px 46px',
            maskImage: 'linear-gradient(to bottom, #000, transparent 78%)',
            WebkitMaskImage: 'linear-gradient(to bottom, #000, transparent 78%)',
          }}
          aria-hidden
        />
      )}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(680px 380px at 78% -8%, rgb(10 132 255 / 0.22), transparent 64%), radial-gradient(560px 320px at 2% 12%, rgb(31 182 224 / 0.16), transparent 62%)',
        }}
        aria-hidden
      />

      <div className="relative mx-auto grid max-w-6xl items-center gap-10 px-4 pb-14 pt-14 lg:grid-cols-[1.06fr_0.94fr] lg:pt-20">
        <motion.div variants={stagger()} initial="hidden" animate="visible">
          {c.badge && (
            <motion.span
              variants={fadeUp}
              className="inline-flex items-center gap-2 rounded-full border border-brand-500/25 bg-brand-500/[0.10] px-3.5 py-1.5 text-[12px] font-semibold text-brand-500"
            >
              <Sparkles className="size-3.5" aria-hidden /> {c.badge}
            </motion.span>
          )}
          <motion.h1 variants={fadeUp} className="mt-4 text-[30px] font-bold leading-[1.25] tracking-tight sm:text-[42px]">
            {renderHeading(heading)}
          </motion.h1>
          {c.subheading && (
            <motion.p variants={fadeUp} className="mt-4 max-w-xl text-[15px] leading-relaxed text-ink-muted">
              {c.subheading}
            </motion.p>
          )}
          <motion.div variants={fadeUp} className="mt-7 flex flex-wrap gap-3">
            <Link
              to={primary.href}
              className="inline-flex h-12 items-center gap-2 rounded-lg bg-gradient-to-br from-brand-400 to-brand-700 px-6 font-display text-sm font-semibold text-white shadow-glow transition-shadow hover:shadow-[0_10px_28px_rgb(10_132_255_/_0.4)]"
            >
              {primary.label} <ArrowRight className="size-4" aria-hidden />
            </Link>
            <Link
              to={secondary.href}
              className="glass inline-flex h-12 items-center rounded-lg border-hairline/25 px-6 font-display text-sm font-semibold text-ink hover:border-hairline/40"
            >
              {secondary.label}
            </Link>
          </motion.div>
        </motion.div>

        <motion.div
          className="relative hidden h-[320px] lg:block"
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1], delay: 0.15 }}
          aria-hidden
        >
          <FloatingCard className="inset-x-8 top-2 bottom-16" delay={0}>
            <div className="mb-3 flex items-center gap-2.5">
              <span className="grid size-9 place-items-center rounded-sm bg-gradient-to-br from-brand-400 to-brand-700 text-white">
                <GraduationCap className="size-4" aria-hidden />
              </span>
              <div>
                <p className="font-display text-[13px] font-semibold">{statCardTitle}</p>
                <p className="text-[10.5px] text-ink-subtle">{statCardSubtitle}</p>
              </div>
            </div>
            <div className="flex h-24 items-end gap-2">
              {[44, 58, 52, 71, 84, 100].map((h, i) => (
                <span key={i} className="flex-1 rounded-t bg-gradient-to-t from-brand-500/25 to-brand-400" style={{ height: `${h}%` }} />
              ))}
            </div>
          </FloatingCard>
          <FloatingCard className="left-0 bottom-2 w-44" delay={0.5}>
            <div className="flex items-center gap-2">
              <Cpu className="size-4 text-brand-500" aria-hidden />
              <p className="font-display text-[12px] font-semibold">{awardCardTitle}</p>
            </div>
            <p className="mt-1 font-display text-2xl font-bold">
              {awardCardNumber}
              {awardCardSuffix && <span className="ml-1.5 text-[11px] font-medium text-success">{awardCardSuffix}</span>}
            </p>
          </FloatingCard>
        </motion.div>
      </div>
    </section>
  );
}

/** เน้นบรรทัดที่สองของหัวข้อด้วยไล่สี */
function renderHeading(text: string) {
  const parts = text.split(' ');
  const mid = Math.ceil(parts.length / 2);
  return (
    <>
      {parts.slice(0, mid).join(' ')}{' '}
      <span className="bg-gradient-to-r from-brand-400 via-cyan-500 to-brand-700 bg-clip-text text-transparent">
        {parts.slice(mid).join(' ')}
      </span>
    </>
  );
}

function FloatingCard({ children, className, delay }: { children: React.ReactNode; className?: string; delay: number }) {
  return (
    <motion.div
      className={`glass-strong absolute rounded-lg p-4 ${className ?? ''}`}
      animate={{ y: [0, -9, 0] }}
      transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut', delay }}
    >
      {children}
    </motion.div>
  );
}
