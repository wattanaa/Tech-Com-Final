/**
 * SEED · ข้อมูลตัวอย่าง (Demo Data)
 *
 * ข้อมูลทั้งหมดในไฟล์นี้เป็น "ข้อมูลสมมติ" สำหรับทดสอบระบบเท่านั้น
 * ชื่อบุคคล รหัสวิชา เบอร์โทร และผลงาน ไม่ใช่ข้อมูลจริงของวิทยาลัย
 * ตอนขึ้นระบบจริง ให้ล้างฐานข้อมูลด้วย  npm run db:reset  แล้วสั่ง
 *   npm run db:seed -- --core-only
 * เพื่อใส่เฉพาะข้อมูลแกนระบบ จากนั้นกรอกข้อมูลจริงผ่าน Admin
 *
 * จำนวนตามที่กำหนด: ครู 5 · รายวิชา 6 · ข่าว 6 · กิจกรรม 6 ·
 *                    ผลงาน 6 · ห้องปฏิบัติการ 5 · ภาพ 20 · นักศึกษา 10
 */
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import {
  type PrismaClient,
  CategoryType,
  ContentStatus,
  ProgramLevel,
} from '@prisma/client';

const UPLOAD_DIR = process.env.UPLOAD_DIR ?? './uploads';
const DEMO_FOLDER = 'demo';

/** คู่สีไล่เฉดสำหรับภาพตัวอย่าง — อยู่ในโทนน้ำเงินของเว็บไซต์ */
const GRADIENTS: [string, string][] = [
  ['#0A84FF', '#0057B8'],
  ['#1FB6E0', '#0A84FF'],
  ['#4C6FFF', '#0A3E9E'],
  ['#00A3C4', '#0057B8'],
  ['#3FC9EC', '#1494B8'],
];

/**
 * สร้างไฟล์ภาพตัวอย่างเป็น SVG แล้วบันทึกลงตาราง media
 * ใช้ SVG เพราะไม่ต้องพึ่งไฟล์ภายนอก และเปิดดูได้จริงบนหน้าเว็บทันทีหลัง seed
 */
async function createDemoMedia(
  prisma: PrismaClient,
  slug: string,
  label: string,
  index: number,
  uploadedById: string | null,
) {
  const [from, to] = GRADIENTS[index % GRADIENTS.length] ?? GRADIENTS[0]!;
  const filename = `demo-${slug}.svg`;
  const width = 1600;
  const height = 900;

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="${from}"/><stop offset="1" stop-color="${to}"/>
    </linearGradient>
    <pattern id="grid" width="64" height="64" patternUnits="userSpaceOnUse">
      <path d="M64 0H0V64" fill="none" stroke="rgba(255,255,255,0.14)" stroke-width="1"/>
    </pattern>
  </defs>
  <rect width="${width}" height="${height}" fill="url(#g)"/>
  <rect width="${width}" height="${height}" fill="url(#grid)"/>
  <text x="50%" y="50%" text-anchor="middle" dominant-baseline="middle"
        font-family="'IBM Plex Sans Thai','Noto Sans Thai',sans-serif" font-size="56"
        font-weight="600" fill="rgba(255,255,255,0.92)">${escapeXml(label)}</text>
  <text x="50%" y="58%" text-anchor="middle" dominant-baseline="middle"
        font-family="monospace" font-size="24" fill="rgba(255,255,255,0.6)">ภาพตัวอย่าง</text>
</svg>`;

  const dir = path.resolve(UPLOAD_DIR, DEMO_FOLDER);
  await mkdir(dir, { recursive: true });
  await writeFile(path.join(dir, filename), svg, 'utf8');

  return prisma.media.upsert({
    where: { filename },
    update: {},
    create: {
      filename,
      originalName: `${label}.svg`,
      mimeType: 'image/svg+xml',
      size: Buffer.byteLength(svg, 'utf8'),
      width,
      height,
      url: `/uploads/${DEMO_FOLDER}/${filename}`,
      thumbnailUrl: `/uploads/${DEMO_FOLDER}/${filename}`,
      alt: label,
      folder: DEMO_FOLDER,
      uploadedById,
    },
  });
}

function escapeXml(s: string): string {
  return s.replace(/[<>&'"]/g, (c) =>
    ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', "'": '&apos;', '"': '&quot;' })[c] ?? c,
  );
}

/** วันที่ย้อนหลังจากวันนี้ N วัน — ให้ข้อมูลตัวอย่างดูสมจริงไม่ว่าจะ seed เมื่อไหร่ */
function daysAgo(n: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - n);
  d.setHours(9, 0, 0, 0);
  return d;
}

function daysAhead(n: number): Date {
  return daysAgo(-n);
}

export async function seedDemoData(prisma: PrismaClient, authorId: string) {
  const alreadySeeded = await prisma.teacher.count();
  if (alreadySeeded > 0) {
    console.log('▸ มีข้อมูลตัวอย่างอยู่แล้ว — ข้ามทั้งหมด');
    return;
  }

  console.log('▸ ข้อมูลตัวอย่าง (ข้อมูลสมมติทั้งหมด)');

  // ─────────────────────────  หมวดหมู่  ─────────────────────────
  const categoryData = [
    { name: 'ประชาสัมพันธ์', slug: 'announcement', type: CategoryType.NEWS, color: '#007AFF', order: 1 },
    { name: 'รางวัล', slug: 'award', type: CategoryType.NEWS, color: '#C77A0C', order: 2 },
    { name: 'อบรม', slug: 'training', type: CategoryType.NEWS, color: '#1FB6E0', order: 3 },
    { name: 'ประกาศ', slug: 'notice', type: CategoryType.NEWS, color: '#0057B8', order: 4 },
    { name: 'กิจกรรมการเรียน', slug: 'learning', type: CategoryType.ACTIVITY, color: '#007AFF', order: 1 },
    { name: 'การแข่งขัน', slug: 'competition', type: CategoryType.ACTIVITY, color: '#C77A0C', order: 2 },
    { name: 'จิตอาสา', slug: 'volunteer', type: CategoryType.ACTIVITY, color: '#0E9C63', order: 3 },
    { name: 'กิจกรรมวิทยาลัย', slug: 'college', type: CategoryType.ACTIVITY, color: '#0057B8', order: 4 },
    { name: 'ระบบสมองกลฝังตัว', slug: 'embedded', type: CategoryType.PROJECT, color: '#007AFF', order: 1 },
    { name: 'เครือข่ายและระบบ', slug: 'network', type: CategoryType.PROJECT, color: '#1FB6E0', order: 2 },
    { name: 'เว็บและแอปพลิเคชัน', slug: 'web-app', type: CategoryType.PROJECT, color: '#4C6FFF', order: 3 },
    { name: 'หัวหน้าแผนก', slug: 'head', type: CategoryType.TEACHER, color: '#0A84FF', order: 1 },
    { name: 'ครูผู้สอน', slug: 'teacher', type: CategoryType.TEACHER, color: '#0057B8', order: 2 },
    { name: 'เจ้าหน้าที่', slug: 'staff', type: CategoryType.TEACHER, color: '#0E9C63', order: 3 },
  ];
  for (const c of categoryData) {
    await prisma.category.upsert({
      where: { slug_type: { slug: c.slug, type: c.type } },
      update: {},
      create: c,
    });
  }
  const categories = await prisma.category.findMany();
  const cat = (slug: string, type: CategoryType) =>
    categories.find((c) => c.slug === slug && c.type === type)?.id ?? null;
  console.log(`  · หมวดหมู่ ${categoryData.length}`);

  // ─────────────────────────  หลักสูตร  ─────────────────────────
  const povocImg = await createDemoMedia(prisma, 'program-povoc', 'ปวช. เทคนิคคอมพิวเตอร์', 0, authorId);
  const povosImg = await createDemoMedia(prisma, 'program-povos', 'ปวส. เทคโนโลยีคอมพิวเตอร์', 1, authorId);

  const povoc = await prisma.program.create({
    data: {
      code: '20127',
      name: 'ประกาศนียบัตรวิชาชีพ สาขาวิชาเทคนิคคอมพิวเตอร์',
      nameEn: 'Vocational Certificate in Computer Technician',
      level: ProgramLevel.POR_WOR_CHOR,
      duration: '3 ปี',
      description:
        'หลักสูตรระดับ ปวช. มุ่งผลิตผู้มีความรู้ความสามารถด้านการประกอบ ติดตั้ง ซ่อมบำรุงเครื่องคอมพิวเตอร์ ระบบเครือข่ายเบื้องต้น และการเขียนโปรแกรมพื้นฐาน รับผู้สำเร็จการศึกษาระดับมัธยมศึกษาปีที่ 3 หรือเทียบเท่า',
      skills: [
        'ประกอบและซ่อมบำรุงเครื่องคอมพิวเตอร์',
        'ติดตั้งระบบปฏิบัติการและโปรแกรมประยุกต์',
        'เดินสายและติดตั้งระบบเครือข่ายเบื้องต้น',
        'เขียนโปรแกรมคอมพิวเตอร์พื้นฐาน',
        'ออกแบบและสร้างเว็บเพจ',
      ],
      order: 1,
      imageId: povocImg.id,
      createdById: authorId,
    },
  });

  const povos = await prisma.program.create({
    data: {
      code: '30901',
      name: 'ประกาศนียบัตรวิชาชีพชั้นสูง สาขาวิชาเทคโนโลยีคอมพิวเตอร์',
      nameEn: 'Diploma in Computer Technology',
      level: ProgramLevel.POR_WOR_SOR,
      duration: '2 ปี',
      description:
        'หลักสูตรระดับ ปวส. เน้นเทคโนโลยีเครือข่าย ระบบปฏิบัติการเซิร์ฟเวอร์ ระบบสมองกลฝังตัวและ IoT รวมถึงการพัฒนาโปรแกรมประยุกต์ รับผู้สำเร็จการศึกษาระดับ ปวช. หรือมัธยมศึกษาปีที่ 6',
      skills: [
        'ออกแบบและติดตั้งระบบเครือข่ายคอมพิวเตอร์',
        'ติดตั้งและดูแลระบบปฏิบัติการเซิร์ฟเวอร์',
        'พัฒนาระบบสมองกลฝังตัวและ IoT',
        'พัฒนาโปรแกรมประยุกต์บนเว็บและอุปกรณ์เคลื่อนที่',
        'ดูแลความมั่นคงปลอดภัยของระบบสารสนเทศ',
      ],
      order: 2,
      imageId: povosImg.id,
      createdById: authorId,
    },
  });
  console.log('  · หลักสูตร 2');

  // ─────────────────────────  ครูและบุคลากร 5 คน  ─────────────────────────
  const teacherSeed = [
    {
      prefix: 'นาย',
      firstName: 'ประวิทย์',
      lastName: 'ธนกิจไพศาล',
      position: 'หัวหน้าแผนกวิชาเทคโนโลยีคอมพิวเตอร์',
      academicRank: 'ครูชำนาญการพิเศษ',
      typeId: cat('head', CategoryType.TEACHER),
      specialties: ['ระบบเครือข่ายคอมพิวเตอร์', 'ความมั่นคงปลอดภัยไซเบอร์', 'ระบบปฏิบัติการเซิร์ฟเวอร์'],
      bio: 'ประสบการณ์สอนด้านระบบเครือข่ายกว่า 18 ปี เป็นผู้ควบคุมทีมนักศึกษาเข้าแข่งขันทักษะวิชาชีพระดับชาติอย่างต่อเนื่อง',
    },
    {
      prefix: 'นางสาว',
      firstName: 'กัลยรัตน์',
      lastName: 'บุญเรืองฤทธิ์',
      position: 'ครูผู้สอน',
      academicRank: 'ครูชำนาญการ',
      typeId: cat('teacher', CategoryType.TEACHER),
      specialties: ['การพัฒนาเว็บแอปพลิเคชัน', 'ฐานข้อมูล', 'การออกแบบส่วนติดต่อผู้ใช้'],
      bio: 'สอนรายวิชาการเขียนโปรแกรมบนเว็บและระบบฐานข้อมูล สนใจงานด้านประสบการณ์ผู้ใช้และการออกแบบระบบสารสนเทศ',
    },
    {
      prefix: 'นาย',
      firstName: 'อรรถพล',
      lastName: 'สินธุ์เจริญ',
      position: 'ครูผู้สอน',
      academicRank: 'ครูชำนาญการ',
      typeId: cat('teacher', CategoryType.TEACHER),
      specialties: ['ระบบสมองกลฝังตัว', 'IoT', 'ไมโครคอนโทรลเลอร์'],
      bio: 'ที่ปรึกษาโครงงานด้านระบบสมองกลฝังตัวและ IoT ผลงานนักศึกษาได้รับรางวัลระดับภาคหลายรายการ',
    },
    {
      prefix: 'นาง',
      firstName: 'ศิริพร',
      lastName: 'วัฒนคีรี',
      position: 'ครูผู้สอน',
      academicRank: 'ครู',
      typeId: cat('teacher', CategoryType.TEACHER),
      specialties: ['การซ่อมบำรุงคอมพิวเตอร์', 'ฮาร์ดแวร์', 'มัลติมีเดีย'],
      bio: 'ดูแลรายวิชาปฏิบัติด้านฮาร์ดแวร์และงานมัลติมีเดีย ควบคุมการฝึกประสบการณ์วิชาชีพของนักศึกษา',
    },
    {
      prefix: 'นางสาว',
      firstName: 'ปิยะดา',
      lastName: 'ศรีสุนทรพงศ์',
      position: 'เจ้าหน้าที่ธุรการแผนกวิชา',
      academicRank: null,
      typeId: cat('staff', CategoryType.TEACHER),
      specialties: ['งานธุรการ', 'งานทะเบียนนักศึกษา', 'งานประชาสัมพันธ์'],
      bio: 'ดูแลงานเอกสาร งานทะเบียน และการประชาสัมพันธ์ข่าวสารของแผนกวิชา',
    },
  ];

  const teachers = [];
  for (const [i, t] of teacherSeed.entries()) {
    const photo = await createDemoMedia(
      prisma,
      `teacher-${i + 1}`,
      `${t.firstName} ${t.lastName}`,
      i,
      authorId,
    );
    teachers.push(
      await prisma.teacher.create({
        data: {
          ...t,
          email: `teacher${i + 1}@example.ac.th`,
          phone: `043-000-00${i + 1}`,
          order: i + 1,
          photoId: photo.id,
          createdById: authorId,
        },
      }),
    );
  }
  console.log(`  · ครูและบุคลากร ${teachers.length}`);

  // ─────────────────────────  รายวิชา 6 วิชา  ─────────────────────────
  const courseSeed = [
    {
      code: '20127-2001',
      name: 'การประกอบเครื่องคอมพิวเตอร์และการติดตั้งซอฟต์แวร์',
      credits: 3,
      hours: 5,
      theoryHours: 1,
      practiceHours: 4,
      description:
        'ศึกษาและปฏิบัติเกี่ยวกับหลักการทำงานของเครื่องคอมพิวเตอร์ การเลือกอุปกรณ์ การประกอบเครื่อง การติดตั้งระบบปฏิบัติการและโปรแกรมประยุกต์ การตรวจสอบและแก้ไขปัญหาเบื้องต้น',
      programId: povoc.id,
      term: '1/2569',
      teacherIdx: [3],
    },
    {
      code: '20127-2004',
      name: 'ระบบเครือข่ายคอมพิวเตอร์เบื้องต้น',
      credits: 3,
      hours: 5,
      theoryHours: 1,
      practiceHours: 4,
      description:
        'ศึกษาและปฏิบัติเกี่ยวกับโครงสร้างระบบเครือข่าย อุปกรณ์เครือข่าย การเข้าหัวสายสัญญาณ การกำหนดหมายเลขไอพี และการทดสอบระบบเครือข่ายขนาดเล็ก',
      programId: povoc.id,
      term: '2/2569',
      teacherIdx: [0],
    },
    {
      code: '20127-2007',
      name: 'การสร้างเว็บไซต์',
      credits: 3,
      hours: 5,
      theoryHours: 1,
      practiceHours: 4,
      description:
        'ศึกษาและปฏิบัติเกี่ยวกับหลักการออกแบบเว็บไซต์ ภาษา HTML และ CSS การจัดวางองค์ประกอบ การใช้งานสคริปต์เบื้องต้น และการนำเว็บไซต์ขึ้นเผยแพร่',
      programId: povoc.id,
      term: '1/2569',
      teacherIdx: [1],
    },
    {
      code: '30901-2003',
      name: 'ระบบปฏิบัติการเครือข่าย',
      credits: 3,
      hours: 5,
      theoryHours: 2,
      practiceHours: 3,
      description:
        'ศึกษาและปฏิบัติเกี่ยวกับการติดตั้งและดูแลระบบปฏิบัติการเครือข่าย การจัดการผู้ใช้และสิทธิ์ การตั้งค่าบริการพื้นฐาน การสำรองและกู้คืนข้อมูล และการรักษาความปลอดภัยของเซิร์ฟเวอร์',
      programId: povos.id,
      term: '1/2569',
      teacherIdx: [0],
    },
    {
      code: '30901-2005',
      name: 'ระบบสมองกลฝังตัวและอินเทอร์เน็ตของสรรพสิ่ง',
      credits: 3,
      hours: 5,
      theoryHours: 2,
      practiceHours: 3,
      description:
        'ศึกษาและปฏิบัติเกี่ยวกับไมโครคอนโทรลเลอร์ การเชื่อมต่อเซนเซอร์ การสื่อสารข้อมูลผ่านเครือข่าย การส่งข้อมูลขึ้นคลาวด์ และการสร้างชิ้นงานต้นแบบ IoT',
      programId: povos.id,
      term: '2/2569',
      teacherIdx: [2],
    },
    {
      code: '30901-2008',
      name: 'การพัฒนาโปรแกรมประยุกต์บนเว็บ',
      credits: 3,
      hours: 5,
      theoryHours: 2,
      practiceHours: 3,
      description:
        'ศึกษาและปฏิบัติเกี่ยวกับการพัฒนาโปรแกรมประยุกต์บนเว็บ การจัดการฐานข้อมูล การเชื่อมต่อผ่าน API การตรวจสอบความถูกต้องของข้อมูล และการนำระบบขึ้นให้บริการ',
      programId: povos.id,
      term: '1/2569',
      teacherIdx: [1, 3],
    },
  ];

  for (const [i, c] of courseSeed.entries()) {
    const { teacherIdx, ...data } = c;
    const img = await createDemoMedia(prisma, `course-${i + 1}`, c.code, i, authorId);
    const course = await prisma.course.create({
      data: { ...data, imageId: img.id, createdById: authorId },
    });
    for (const idx of teacherIdx) {
      const teacher = teachers[idx];
      if (teacher) {
        await prisma.courseTeacher.create({
          data: { courseId: course.id, teacherId: teacher.id },
        });
      }
    }
  }
  console.log(`  · รายวิชา ${courseSeed.length}`);

  // ─────────────────────────  นักศึกษา 10 คน  ─────────────────────────
  const studentSeed = [
    { prefix: 'นาย', firstName: 'ธีรภัทร', lastName: 'คงสวัสดิ์', level: 'ปวส.2', program: povos.id },
    { prefix: 'นางสาว', firstName: 'ณัฐริกา', lastName: 'พูลสวัสดิ์', level: 'ปวส.2', program: povos.id },
    { prefix: 'นาย', firstName: 'ชนาธิป', lastName: 'แก้วประเสริฐ', level: 'ปวส.2', program: povos.id },
    { prefix: 'นาย', firstName: 'กิตติภพ', lastName: 'อินทรสุวรรณ', level: 'ปวส.1', program: povos.id },
    { prefix: 'นางสาว', firstName: 'พิมพ์ลภัส', lastName: 'ศรีวิไล', level: 'ปวส.1', program: povos.id },
    { prefix: 'นาย', firstName: 'ภูวดล', lastName: 'จันทร์เพ็ญ', level: 'ปวช.3', program: povoc.id },
    { prefix: 'นางสาว', firstName: 'อริสา', lastName: 'มณีโชติ', level: 'ปวช.3', program: povoc.id },
    { prefix: 'นาย', firstName: 'สหรัฐ', lastName: 'บุญมาก', level: 'ปวช.3', program: povoc.id },
    { prefix: 'นาย', firstName: 'จิรายุ', lastName: 'ทองใบ', level: 'ปวช.2', program: povoc.id },
    { prefix: 'นางสาว', firstName: 'ปาลิตา', lastName: 'เรืองสุวรรณ', level: 'ปวช.2', program: povoc.id },
  ];

  const students = [];
  for (const [i, s] of studentSeed.entries()) {
    students.push(
      await prisma.student.create({
        data: {
          studentCode: `69${String(30101 + i).padStart(6, '0')}`,
          prefix: s.prefix,
          firstName: s.firstName,
          lastName: s.lastName,
          level: s.level,
          classRoom: `${s.level}/${(i % 2) + 1}`,
          year: 2569,
          programId: s.program,
          createdById: authorId,
        },
      }),
    );
  }
  console.log(`  · นักศึกษา ${students.length}`);

  // ─────────────────────────  ข่าว 6 รายการ  ─────────────────────────
  const newsSeed = [
    {
      title: 'นักศึกษา ปวส.2 คว้ารางวัลรองชนะเลิศ การแข่งขันทักษะเครือข่ายคอมพิวเตอร์ ระดับภาค',
      slug: 'award-network-skill-2569',
      excerpt:
        'ทีมนักศึกษาแผนกวิชาเทคโนโลยีคอมพิวเตอร์ เข้าร่วมการแข่งขันทักษะวิชาชีพ ระดับภาคตะวันออกเฉียงเหนือ และคว้ารางวัลรองชนะเลิศอันดับ 1',
      category: 'award',
      status: ContentStatus.PUBLISHED,
      publishedAt: daysAgo(7),
      views: 1204,
      isPinned: true,
    },
    {
      title: 'เปิดอบรมหลักสูตรระยะสั้น “การติดตั้งและดูแลระบบปฏิบัติการ Linux Server”',
      slug: 'short-course-linux-server',
      excerpt:
        'อบรม 30 ชั่วโมง สำหรับนักศึกษาและบุคคลทั่วไป พร้อมรับวุฒิบัตรจากวิทยาลัย รับจำนวนจำกัด 25 ที่นั่ง',
      category: 'training',
      status: ContentStatus.REVIEW,
      publishedAt: null,
      views: 0,
      isPinned: false,
    },
    {
      title: 'เปิดรับสมัครนักเรียนนักศึกษาใหม่ ประจำปีการศึกษา 2570',
      slug: 'admission-2570',
      excerpt:
        'รับสมัครทั้งระดับ ปวช. และ ปวส. สาขาวิชาเทคโนโลยีคอมพิวเตอร์ สมัครออนไลน์ได้ตั้งแต่บัดนี้เป็นต้นไป',
      category: 'announcement',
      status: ContentStatus.PUBLISHED,
      publishedAt: daysAgo(22),
      views: 2517,
      isPinned: true,
    },
    {
      title: 'กำหนดการปฐมนิเทศนักศึกษาฝึกประสบการณ์วิชาชีพ ภาคเรียนที่ 2/2569',
      slug: 'internship-orientation-2-2569',
      excerpt:
        'นักศึกษาที่ออกฝึกประสบการณ์วิชาชีพทุกคนต้องเข้าร่วมปฐมนิเทศ พร้อมรับเอกสารและคู่มือการฝึกงาน',
      category: 'notice',
      status: ContentStatus.APPROVED,
      publishedAt: daysAhead(3),
      views: 0,
      isPinned: false,
    },
    {
      title: 'โครงการบริการวิชาการ ซ่อมคอมพิวเตอร์ให้โรงเรียนในพื้นที่อำเภอธวัชบุรี',
      slug: 'service-project-thawatburi',
      excerpt:
        'ครูและนักศึกษาออกให้บริการซ่อมบำรุงเครื่องคอมพิวเตอร์แก่โรงเรียนขนาดเล็ก จำนวน 4 แห่ง',
      category: 'announcement',
      status: ContentStatus.DRAFT,
      publishedAt: null,
      views: 0,
      isPinned: false,
    },
    {
      title: 'ผลการคัดเลือกนักศึกษาเข้าร่วมโครงการทวิภาคี ปีการศึกษา 2569',
      slug: 'dual-vocational-result-2569',
      excerpt:
        'ประกาศรายชื่อนักศึกษาที่ผ่านการคัดเลือกเข้าร่วมโครงการจัดการศึกษาระบบทวิภาคีร่วมกับสถานประกอบการ',
      category: 'notice',
      status: ContentStatus.ARCHIVED,
      publishedAt: daysAgo(97),
      views: 941,
      isPinned: false,
    },
  ];

  for (const [i, n] of newsSeed.entries()) {
    const cover = await createDemoMedia(prisma, `news-${i + 1}`, n.title.slice(0, 28), i, authorId);
    await prisma.news.create({
      data: {
        title: n.title,
        slug: n.slug,
        excerpt: n.excerpt,
        content: `${n.excerpt}\n\nรายละเอียดเพิ่มเติมของข่าวนี้เป็นข้อความตัวอย่างสำหรับทดสอบระบบแสดงผลเนื้อหาข่าว ผู้ดูแลระบบสามารถแก้ไขเนื้อหาทั้งหมดได้จากหน้าจัดการข่าวประชาสัมพันธ์ในระบบหลังบ้าน โดยไม่ต้องแก้ไขโค้ดของเว็บไซต์\n\nสอบถามรายละเอียดเพิ่มเติมได้ที่แผนกวิชาเทคโนโลยีคอมพิวเตอร์ ในวันและเวลาราชการ`,
        status: n.status,
        publishedAt: n.publishedAt,
        views: n.views,
        isPinned: n.isPinned,
        categoryId: cat(n.category, CategoryType.NEWS),
        authorId,
        coverImageId: cover.id,
        createdById: authorId,
      },
    });
  }
  console.log(`  · ข่าว ${newsSeed.length}`);

  // ─────────────────────────  กิจกรรม 6 รายการ  ─────────────────────────
  const activitySeed = [
    {
      title: 'ศึกษาดูงานศูนย์ข้อมูลและระบบเครือข่าย บริษัทโทรคมนาคมแห่งชาติ',
      slug: 'study-visit-datacenter',
      description: 'นักศึกษา ปวส. เข้าศึกษาดูงานระบบศูนย์ข้อมูลและการบริหารจัดการเครือข่ายขนาดใหญ่',
      category: 'learning',
      startDay: 12,
      location: 'จังหวัดขอนแก่น',
    },
    {
      title: 'การแข่งขันทักษะวิชาชีพ ระดับสถานศึกษา ประจำปีการศึกษา 2569',
      slug: 'skill-competition-college-2569',
      description: 'คัดเลือกตัวแทนนักศึกษาเข้าแข่งขันทักษะวิชาชีพในระดับอาชีวศึกษาจังหวัด',
      category: 'competition',
      startDay: 26,
      location: 'อาคารปฏิบัติการคอมพิวเตอร์ วิทยาลัยเทคนิคร้อยเอ็ด',
    },
    {
      title: 'อบรมเชิงปฏิบัติการ การเขียนโปรแกรมควบคุมไมโครคอนโทรลเลอร์',
      slug: 'workshop-microcontroller',
      description: 'อบรมเชิงปฏิบัติการ 2 วัน สำหรับนักศึกษาที่สนใจงานด้านระบบสมองกลฝังตัวและ IoT',
      category: 'learning',
      startDay: 40,
      location: 'ห้องปฏิบัติการ IoT',
    },
    {
      title: 'กิจกรรมจิตอาสา ซ่อมบำรุงคอมพิวเตอร์เพื่อชุมชน',
      slug: 'volunteer-computer-repair',
      description: 'นักศึกษาออกให้บริการซ่อมบำรุงคอมพิวเตอร์แก่หน่วยงานและโรงเรียนในพื้นที่ใกล้เคียง',
      category: 'volunteer',
      startDay: 55,
      location: 'อำเภอธวัชบุรี จังหวัดร้อยเอ็ด',
    },
    {
      title: 'พิธีไหว้ครูและมอบทุนการศึกษา ประจำปีการศึกษา 2569',
      slug: 'wai-kru-ceremony-2569',
      description: 'กิจกรรมไหว้ครูของวิทยาลัย พร้อมมอบทุนการศึกษาแก่นักศึกษาที่มีผลการเรียนดีเด่น',
      category: 'college',
      startDay: 78,
      location: 'หอประชุมวิทยาลัยเทคนิคร้อยเอ็ด',
    },
    {
      title: 'ค่ายเตรียมความพร้อมนักศึกษาใหม่ แผนกวิชาเทคโนโลยีคอมพิวเตอร์',
      slug: 'freshman-camp-2569',
      description: 'ปรับพื้นฐานด้านคอมพิวเตอร์และสร้างความสัมพันธ์ระหว่างรุ่นพี่รุ่นน้องก่อนเปิดภาคเรียน',
      category: 'college',
      startDay: 110,
      location: 'แผนกวิชาเทคโนโลยีคอมพิวเตอร์',
    },
  ];

  for (const [i, a] of activitySeed.entries()) {
    const cover = await createDemoMedia(prisma, `activity-${i + 1}`, a.title.slice(0, 24), i, authorId);
    await prisma.activity.create({
      data: {
        title: a.title,
        slug: a.slug,
        description: a.description,
        content: `${a.description}\n\nรายละเอียดกิจกรรมนี้เป็นข้อความตัวอย่างสำหรับทดสอบระบบ ผู้ดูแลสามารถแก้ไขได้จากหน้าจัดการกิจกรรม`,
        startDate: daysAgo(a.startDay),
        endDate: daysAgo(a.startDay - 1),
        location: a.location,
        status: ContentStatus.PUBLISHED,
        views: 120 + i * 37,
        categoryId: cat(a.category, CategoryType.ACTIVITY),
        coverImageId: cover.id,
        createdById: authorId,
      },
    });
  }
  console.log(`  · กิจกรรม ${activitySeed.length}`);

  // ─────────────────────────  ผลงานนักศึกษา 6 ผลงาน  ─────────────────────────
  const projectSeed = [
    {
      name: 'ระบบรดน้ำแปลงผักอัตโนมัติผ่านแอปพลิเคชัน',
      slug: 'smart-farm-watering',
      description:
        'ระบบควบคุมการรดน้ำแปลงผักอัตโนมัติ ใช้เซนเซอร์วัดความชื้นในดินร่วมกับการสั่งงานผ่านแอปพลิเคชันบนโทรศัพท์',
      category: 'embedded',
      technologies: ['ESP32', 'MQTT', 'Node.js', 'React Native'],
      award: 'รางวัลชนะเลิศ สิ่งประดิษฐ์ของคนรุ่นใหม่ ระดับอาชีวศึกษาจังหวัด',
      memberIdx: [0, 1, 2],
      advisorIdx: 2,
    },
    {
      name: 'ระบบเช็กชื่อเข้าเรียนด้วยการสแกนใบหน้า',
      slug: 'face-attendance-system',
      description:
        'ระบบบันทึกเวลาเข้าเรียนของนักศึกษาด้วยการรู้จำใบหน้า ลดเวลาการเช็กชื่อและป้องกันการเช็กชื่อแทนกัน',
      category: 'web-app',
      technologies: ['Python', 'OpenCV', 'FastAPI', 'PostgreSQL'],
      award: null,
      memberIdx: [3, 4],
      advisorIdx: 1,
    },
    {
      name: 'ระบบเฝ้าระวังและแจ้งเตือนสถานะอุปกรณ์เครือข่าย',
      slug: 'network-monitoring-alert',
      description:
        'ระบบตรวจสอบสถานะอุปกรณ์เครือข่ายภายในวิทยาลัย และแจ้งเตือนผ่าน LINE เมื่ออุปกรณ์ขาดการเชื่อมต่อ',
      category: 'network',
      technologies: ['SNMP', 'Zabbix', 'LINE Notify', 'Docker'],
      award: 'รางวัลรองชนะเลิศอันดับ 1 การแข่งขันทักษะเครือข่ายคอมพิวเตอร์ ระดับภาค',
      memberIdx: [0, 2],
      advisorIdx: 0,
    },
    {
      name: 'เว็บไซต์ระบบยืม-คืนครุภัณฑ์แผนกวิชา',
      slug: 'equipment-borrowing-system',
      description:
        'ระบบจัดการการยืม-คืนครุภัณฑ์ของแผนกวิชา พร้อมประวัติการยืมและการแจ้งเตือนกำหนดคืน',
      category: 'web-app',
      technologies: ['React', 'TypeScript', 'Express', 'Prisma'],
      award: null,
      memberIdx: [5, 6, 7],
      advisorIdx: 1,
    },
    {
      name: 'ตู้อบเอกสารควบคุมอุณหภูมิด้วยไมโครคอนโทรลเลอร์',
      slug: 'document-drying-cabinet',
      description:
        'ตู้ควบคุมอุณหภูมิและความชื้นสำหรับเก็บรักษาเอกสารสำคัญ แสดงค่าผ่านจอและบันทึกข้อมูลย้อนหลัง',
      category: 'embedded',
      technologies: ['Arduino', 'DHT22', 'Relay Module'],
      award: null,
      memberIdx: [8, 9],
      advisorIdx: 2,
    },
    {
      name: 'ระบบจัดคิวบริการซ่อมคอมพิวเตอร์ออนไลน์',
      slug: 'repair-queue-system',
      description:
        'ระบบรับแจ้งซ่อมและจัดคิวงานซ่อมคอมพิวเตอร์ของแผนกวิชา ติดตามสถานะงานได้แบบเรียลไทม์',
      category: 'web-app',
      technologies: ['Vue', 'Laravel', 'MySQL'],
      award: null,
      memberIdx: [1, 6],
      advisorIdx: 3,
    },
  ];

  for (const [i, p] of projectSeed.entries()) {
    const cover = await createDemoMedia(prisma, `project-${i + 1}`, p.name.slice(0, 24), i, authorId);
    const project = await prisma.project.create({
      data: {
        name: p.name,
        slug: p.slug,
        description: p.description,
        year: 2569,
        technologies: p.technologies,
        award: p.award,
        status: ContentStatus.PUBLISHED,
        categoryId: cat(p.category, CategoryType.PROJECT),
        advisorId: teachers[p.advisorIdx]?.id ?? null,
        coverImageId: cover.id,
        createdById: authorId,
      },
    });
    for (const [j, idx] of p.memberIdx.entries()) {
      const student = students[idx];
      if (student) {
        await prisma.projectMember.create({
          data: {
            projectId: project.id,
            studentId: student.id,
            role: j === 0 ? 'หัวหน้าทีม' : 'สมาชิก',
          },
        });
      }
    }
  }
  console.log(`  · ผลงานนักศึกษา ${projectSeed.length}`);

  // ─────────────────────────  ห้องปฏิบัติการ 5 ห้อง  ─────────────────────────
  const facilitySeed = [
    {
      name: 'ห้องปฏิบัติการคอมพิวเตอร์ 1',
      slug: 'computer-lab-1',
      description:
        'ห้องปฏิบัติการสำหรับรายวิชาพื้นฐานด้านคอมพิวเตอร์ การใช้โปรแกรมสำนักงาน และการเขียนโปรแกรมเบื้องต้น',
      computerCount: 40,
      software: ['Windows 11', 'Microsoft Office', 'Visual Studio Code', 'Git'],
      equipment: ['โปรเจกเตอร์', 'เครื่องปรับอากาศ', 'กระดานอัจฉริยะ'],
      location: 'อาคาร 4 ชั้น 2 ห้อง 421',
    },
    {
      name: 'ห้องปฏิบัติการระบบเครือข่าย',
      slug: 'network-lab',
      description:
        'ห้องปฏิบัติการสำหรับการออกแบบ ติดตั้ง และทดสอบระบบเครือข่ายคอมพิวเตอร์ พร้อมอุปกรณ์เครือข่ายจริง',
      computerCount: 25,
      software: ['Cisco Packet Tracer', 'Wireshark', 'GNS3', 'Ubuntu Server'],
      equipment: ['Router 8 ตัว', 'Switch 12 ตัว', 'ตู้ Rack', 'ชุดเข้าหัวสาย UTP'],
      location: 'อาคาร 4 ชั้น 2 ห้อง 423',
    },
    {
      name: 'ห้องปฏิบัติการ IoT และระบบสมองกลฝังตัว',
      slug: 'iot-lab',
      description:
        'ห้องปฏิบัติการสำหรับงานไมโครคอนโทรลเลอร์ เซนเซอร์ และการพัฒนาชิ้นงานต้นแบบ IoT',
      computerCount: 20,
      software: ['Arduino IDE', 'PlatformIO', 'Node-RED', 'Thonny'],
      equipment: ['ชุดบอร์ด ESP32', 'ชุดบอร์ด Arduino', 'เซนเซอร์หลากหลายชนิด', 'เครื่องพิมพ์ 3 มิติ'],
      location: 'อาคาร 4 ชั้น 3 ห้อง 431',
    },
    {
      name: 'ห้องปฏิบัติการปัญญาประดิษฐ์',
      slug: 'ai-lab',
      description:
        'ห้องปฏิบัติการสำหรับการเรียนรู้ด้านข้อมูลและปัญญาประดิษฐ์ รองรับการประมวลผลด้วยการ์ดจอประสิทธิภาพสูง',
      computerCount: 15,
      software: ['Python', 'TensorFlow', 'PyTorch', 'Jupyter Notebook'],
      equipment: ['เครื่องคอมพิวเตอร์พร้อม GPU', 'กล้องสำหรับงาน Computer Vision'],
      location: 'อาคาร 4 ชั้น 3 ห้อง 433',
    },
    {
      name: 'ห้องปฏิบัติการมัลติมีเดีย',
      slug: 'multimedia-lab',
      description:
        'ห้องปฏิบัติการสำหรับงานออกแบบกราฟิก ตัดต่อวิดีโอ และผลิตสื่อประชาสัมพันธ์ของแผนกวิชา',
      computerCount: 25,
      software: ['Adobe Photoshop', 'Adobe Premiere Pro', 'Figma', 'Blender'],
      equipment: ['กล้องถ่ายภาพ', 'ไฟสตูดิโอ', 'ฉากเขียว', 'ไมโครโฟน'],
      location: 'อาคาร 4 ชั้น 1 ห้อง 412',
    },
  ];

  for (const [i, f] of facilitySeed.entries()) {
    const cover = await createDemoMedia(prisma, `facility-${i + 1}`, f.name, i, authorId);
    await prisma.facility.create({
      data: { ...f, order: i + 1, coverImageId: cover.id, createdById: authorId },
    });
  }
  console.log(`  · ห้องปฏิบัติการ ${facilitySeed.length}`);

  // ─────────────────────────  อัลบั้มภาพ รวม 20 ภาพ  ─────────────────────────
  const albumSeed = [
    { name: 'การแข่งขันทักษะวิชาชีพ 2569', slug: 'album-skill-2569', count: 8, eventDay: 26 },
    { name: 'ศึกษาดูงานศูนย์ข้อมูล', slug: 'album-study-visit', count: 6, eventDay: 12 },
    { name: 'กิจกรรมจิตอาสาเพื่อชุมชน', slug: 'album-volunteer', count: 6, eventDay: 55 },
  ];

  let imageCount = 0;
  for (const [ai, a] of albumSeed.entries()) {
    const images = [];
    for (let i = 0; i < a.count; i++) {
      images.push(
        await createDemoMedia(
          prisma,
          `gallery-${a.slug}-${i + 1}`,
          `${a.name} ${i + 1}`,
          ai + i,
          authorId,
        ),
      );
    }
    const album = await prisma.album.create({
      data: {
        name: a.name,
        slug: a.slug,
        description: `ภาพบรรยากาศ${a.name} ของแผนกวิชาเทคโนโลยีคอมพิวเตอร์`,
        eventDate: daysAgo(a.eventDay),
        isPublished: true,
        order: ai + 1,
        coverImageId: images[0]?.id ?? null,
        createdById: authorId,
      },
    });
    for (const [i, media] of images.entries()) {
      await prisma.galleryImage.create({
        data: {
          albumId: album.id,
          mediaId: media.id,
          caption: `${a.name} ภาพที่ ${i + 1}`,
          order: i + 1,
        },
      });
      imageCount++;
    }
  }
  console.log(`  · อัลบั้ม ${albumSeed.length} · ภาพในคลัง ${imageCount}`);

  // ─────────────────────────  ข้อความติดต่อ  ─────────────────────────
  await prisma.contactMessage.createMany({
    data: [
      {
        name: 'สมหญิง ใจดี',
        email: 'somying@example.com',
        phone: '08x-xxx-xxxx',
        subject: 'สอบถามการรับสมัคร ปวส.',
        message: 'อยากทราบว่าผู้จบ ม.6 สายสามัญ สามารถสมัครเรียน ปวส. สาขานี้ได้หรือไม่คะ',
        isRead: false,
      },
      {
        name: 'วีระพงษ์ มั่นคง',
        email: 'weerapong@example.com',
        subject: 'ขอความอนุเคราะห์วิทยากร',
        message: 'ทางโรงเรียนขอเชิญครูจากแผนกวิชาเป็นวิทยากรอบรมคอมพิวเตอร์ให้นักเรียนครับ',
        isRead: false,
      },
      {
        name: 'ปรียานุช แสงทอง',
        email: 'preeyanuch@example.com',
        subject: 'สอบถามหลักสูตรระยะสั้น',
        message: 'หลักสูตรระยะสั้น Linux Server ยังเปิดรับสมัครอยู่ไหมคะ และมีค่าใช้จ่ายเท่าไร',
        isRead: true,
      },
    ],
  });
  console.log('  · ข้อความติดต่อ 3');
}
