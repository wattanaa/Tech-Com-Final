/**
 * จุดเริ่มต้น Seed — เรียกใช้ผ่าน `npm run db:seed` (หรือ `prisma migrate reset` ที่เรียกอัตโนมัติ)
 *
 *   npx tsx prisma/seed.ts                ครบทุกอย่าง (แกนระบบ + ข้อมูลตัวอย่าง)
 *   npx tsx prisma/seed.ts --core-only     เฉพาะแกนระบบ (บทบาท/สิทธิ์/ผู้ดูแล/เมนู/ตั้งค่า/SEO) ไม่มีข้อมูลตัวอย่าง
 *
 * ทุกฟังก์ชันย่อยเป็น idempotent — รันซ้ำได้เสมอโดยไม่สร้างข้อมูลซ้ำ
 */
import { PrismaClient } from '@prisma/client';
import {
  seedRolesAndPermissions,
  seedAdminUser,
  seedHomepageSections,
  seedNavigation,
  seedSiteSettings,
  seedSeoSettings,
} from './seeds/core.js';
import { seedDemoData } from './seeds/demo.js';

const prisma = new PrismaClient();
const coreOnly = process.argv.includes('--core-only');

async function main() {
  console.log('🌱 เริ่มต้นการ Seed ข้อมูล...');

  const roles = await seedRolesAndPermissions(prisma);
  const superAdminRole = roles.get('SUPER_ADMIN');
  if (!superAdminRole) throw new Error('ไม่พบบทบาท SUPER_ADMIN หลัง seed บทบาท');

  const admin = await seedAdminUser(prisma, superAdminRole.id);
  await seedHomepageSections(prisma);
  await seedNavigation(prisma);
  await seedSiteSettings(prisma);
  await seedSeoSettings(prisma);

  if (!coreOnly) {
    if (!admin) {
      console.warn(
        '⚠ ข้ามข้อมูลตัวอย่าง — ไม่มีบัญชีผู้ดูแลให้เป็นผู้เขียน (ตั้ง SEED_ADMIN_EMAIL / SEED_ADMIN_PASSWORD ใน .env ก่อน)',
      );
    } else {
      await seedDemoData(prisma, admin.id);
    }
  }

  console.log('✅ Seed ข้อมูลเรียบร้อยแล้ว!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
