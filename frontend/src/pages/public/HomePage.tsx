import { Fragment } from 'react';
import { useQuery } from '@tanstack/react-query';
import type { HomepageSection, SectionType } from '@/types';
import { getHomepageSections } from '@/api/public';
import { renderSection } from '@/sections/registry';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';

/** ลำดับ section เริ่มต้น — ใช้เมื่อยังโหลดจาก API ไม่ได้ เว็บจึงแสดงหน้าแรกได้เสมอ */
const FALLBACK_ORDER: SectionType[] = [
  'HERO', 'STATISTICS', 'ABOUT', 'PROGRAMS', 'COURSES',
  'TEACHERS', 'PROJECTS', 'ACTIVITIES', 'NEWS', 'GALLERY', 'FACILITIES', 'CONTACT',
];

/**
 * หน้าแรก — ประกอบขึ้นจากตาราง homepage_sections ตามลำดับที่กำหนดในระบบหลังบ้าน
 * ผู้ดูแลจึงสลับ/ซ่อน section ได้โดยไม่ต้องแก้โค้ด
 */
export default function HomePage() {
  useDocumentTitle();
  const { data } = useQuery({
    queryKey: ['homepage-sections'],
    queryFn: getHomepageSections,
    staleTime: 5 * 60_000,
  });

  const sections: HomepageSection[] =
    data && data.length > 0
      ? data
      : FALLBACK_ORDER.map((type, i) => ({ id: type, type, order: i, config: {}, title: null, subtitle: null }));

  return (
    <div className="flex flex-col">
      {sections.map((section) => (
        <Fragment key={section.id}>{renderSection(section)}</Fragment>
      ))}
    </div>
  );
}
