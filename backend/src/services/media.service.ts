import { mkdir, unlink, writeFile } from 'node:fs/promises';
import { randomUUID } from 'node:crypto';
import path from 'node:path';
import sharp from 'sharp';
import { prisma } from '../config/database.js';
import { env } from '../config/env.js';
import { ApiError } from '../utils/ApiError.js';
import { logger } from '../utils/logger.js';

/** ลายเซ็นไบต์แรกของแต่ละชนิดไฟล์ — นามสกุลกับ Content-Type ปลอมได้ แต่เนื้อไฟล์ปลอมยาก */
const MAGIC_BYTES: { mime: string; check: (b: Buffer) => boolean }[] = [
  { mime: 'image/jpeg', check: (b) => b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff },
  {
    mime: 'image/png',
    check: (b) => b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47,
  },
  {
    mime: 'image/webp',
    check: (b) => b.subarray(0, 4).toString() === 'RIFF' && b.subarray(8, 12).toString() === 'WEBP',
  },
  {
    mime: 'image/gif',
    check: (b) => b.subarray(0, 4).toString('ascii') === 'GIF8',
  },
  {
    // ไฟล์ MP4/MOV ทุกไฟล์มีกล่อง "ftyp" อยู่ที่ offset 4-7 เสมอ (ISO base media format)
    mime: 'video/mp4',
    check: (b) => b.length >= 8 && b.subarray(4, 8).toString('ascii') === 'ftyp',
  },
  {
    mime: 'video/webm',
    check: (b) => b[0] === 0x1a && b[1] === 0x45 && b[2] === 0xdf && b[3] === 0xa3,
  },
];

const VIDEO_EXTENSION: Record<string, string> = {
  'video/mp4': 'mp4',
  'video/webm': 'webm',
};

const THUMBNAIL_WIDTH = 480;
const MAX_WIDTH = 2000;

export interface UploadedFile {
  originalname: string;
  mimetype: string;
  size: number;
  buffer: Buffer;
}

/**
 * ตรวจและบันทึกไฟล์ที่อัปโหลด
 *
 * ขั้นตอนความปลอดภัย:
 *  1. ตรวจลายเซ็นไบต์ ไม่เชื่อ Content-Type ที่ client ส่งมา
 *  2. แปลงไฟล์ใหม่ด้วย sharp — สคริปต์หรือ payload ที่แอบฝังมาจะถูกทิ้งไปพร้อมการแปลง
 *  3. ตั้งชื่อไฟล์ใหม่เป็น UUID — ชื่อเดิมของผู้ใช้ไม่มีผลต่อเส้นทางไฟล์บนเซิร์ฟเวอร์
 */
export async function saveUpload(file: UploadedFile, uploadedById: string, folder = 'general') {
  if (file.buffer.length === 0) throw ApiError.badRequest('ไฟล์ว่างเปล่า');

  const isSvg = file.mimetype === 'image/svg+xml';
  const matched = isSvg ? null : MAGIC_BYTES.find((m) => m.check(file.buffer));
  if (!isSvg && !matched) {
    throw ApiError.badRequest('เนื้อไฟล์ไม่ตรงกับชนิดที่รองรับ กรุณาตรวจสอบไฟล์อีกครั้ง');
  }

  const isVideo = matched?.mime.startsWith('video/') ?? false;
  const isGif = matched?.mime === 'image/gif';

  // เพดานขนาดแยกตามชนิดไฟล์ — วิดีโอไฟล์ใหญ่กว่ารูปมากโดยธรรมชาติ ต้องรอให้อ่าน buffer
  // ครบก่อนถึงจะรู้ขนาดจริง (multer เช็คแค่เพดานรวมสูงสุดไว้ชั้นนอกใน upload.middleware.ts)
  const sizeLimit = isVideo ? env.maxVideoUploadBytes : env.maxUploadBytes;
  if (file.buffer.length > sizeLimit) {
    const limitMb = isVideo ? env.MAX_VIDEO_UPLOAD_SIZE_MB : env.MAX_UPLOAD_SIZE_MB;
    throw ApiError.payloadTooLarge(
      `ไฟล์${isVideo ? 'วิดีโอ' : 'รูปภาพ'}ใหญ่เกิน ${limitMb} MB กรุณาย่อขนาดก่อนอัปโหลด`,
    );
  }

  const id = randomUUID();
  const safeFolder = folder.replace(/[^a-z0-9-]/gi, '').slice(0, 40) || 'general';
  const dir = path.resolve(env.UPLOAD_DIR, safeFolder);
  await mkdir(dir, { recursive: true });

  let filename: string;
  let thumbnailName: string | null = null;
  // SVG ไม่มี thumbnail แยก แต่ใช้ตัวเองแทนได้ (ไฟล์เล็ก) — วิดีโอห้าม fallback แบบเดียวกัน
  let thumbnailUrl: string | null = null;
  let width: number | null = null;
  let height: number | null = null;
  let size: number;
  let mimeType: string;

  if (isSvg) {
    // SVG เป็น XML รันสคริปต์ได้ จึงต้องล้างก่อนเก็บ และ sharp แปลงให้ไม่ได้
    const cleaned = sanitizeSvg(file.buffer.toString('utf8'));
    filename = `${id}.svg`;
    await writeFile(path.join(dir, filename), cleaned, 'utf8');
    size = Buffer.byteLength(cleaned, 'utf8');
    mimeType = 'image/svg+xml';
    thumbnailUrl = `/uploads/${safeFolder}/${filename}`;
  } else if (isVideo) {
    // ไม่มี ffmpeg ในเซิร์ฟเวอร์ — เก็บไฟล์ต้นฉบับตรงๆ ไม่ตัดต่อ/สร้าง thumbnail
    // เบราว์เซอร์แสดง poster เฟรมแรกให้เองผ่าน <video preload="metadata"> โดยไม่ต้องประมวลผลฝั่งเซิร์ฟเวอร์
    const ext = VIDEO_EXTENSION[matched!.mime] ?? 'mp4';
    filename = `${id}.${ext}`;
    await writeFile(path.join(dir, filename), file.buffer);
    size = file.buffer.length;
    mimeType = matched!.mime;
    // thumbnailUrl ปล่อยเป็น null โดยตั้งใจ — ห้าม fallback ไปที่ url วิดีโอ เพราะ <img src>
    // ที่ชี้ไปไฟล์วิดีโอจะขึ้นไอคอนรูปแตก ไม่ใช่ภาพตัวอย่างจริง
  } else {
    // ภาพนิ่งทั่วไปและ GIF ใช้ sharp เหมือนกัน ต่างกันแค่ต้องรักษาเฟรมเคลื่อนไหวของ GIF ไว้
    const image = sharp(file.buffer, { failOn: 'error', animated: isGif });
    const meta = await image.metadata();

    filename = `${id}.webp`;
    thumbnailName = `${id}-thumb.webp`;

    // ย่อภาพที่ใหญ่เกินจำเป็น — ไม่มีใครต้องการภาพกว้าง 6000px บนหน้าเว็บ
    // GIF: คงเฟรมเคลื่อนไหวไว้ในไฟล์หลัก (animated webp เล่นได้เหมือน <img> ปกติ) แต่ .rotate()
    // ไม่มีความหมายกับ GIF (ไม่มี EXIF orientation) จึงข้ามไป
    let mainPipeline = image.clone().resize({ width: MAX_WIDTH, withoutEnlargement: true });
    if (!isGif) mainPipeline = mainPipeline.rotate(); // หมุนตาม EXIF แล้วทิ้ง metadata (รวม GPS ถ้ามี)
    const main = await mainPipeline.webp({ quality: isGif ? 78 : 82 }).toBuffer();

    // thumbnail ของ GIF เป็นภาพนิ่งเฟรมแรกเสมอ (animated:false) — กริดตัวอย่างไม่จำเป็นต้องเคลื่อนไหว
    const thumb = await sharp(file.buffer, { animated: false })
      .rotate()
      .resize({ width: THUMBNAIL_WIDTH, withoutEnlargement: true })
      .webp({ quality: 72 })
      .toBuffer();

    await writeFile(path.join(dir, filename), main);
    await writeFile(path.join(dir, thumbnailName), thumb);

    size = main.length;
    mimeType = 'image/webp';
    width = meta.width ? Math.min(meta.width, MAX_WIDTH) : null;
    height =
      meta.width && meta.height
        ? Math.round((Math.min(meta.width, MAX_WIDTH) / meta.width) * meta.height)
        : null;
    thumbnailUrl = `/uploads/${safeFolder}/${thumbnailName}`;
  }

  return prisma.media.create({
    data: {
      filename: `${safeFolder}/${filename}`,
      originalName: file.originalname.slice(0, 200),
      mimeType,
      size,
      width,
      height,
      url: `/uploads/${safeFolder}/${filename}`,
      thumbnailUrl,
      alt: file.originalname.replace(/\.[^.]+$/, '').slice(0, 200),
      folder: safeFolder,
      uploadedById,
    },
  });
}

/**
 * ล้าง SVG ให้ปลอดภัย
 * ตัดสคริปต์ ตัวจัดการเหตุการณ์ และลิงก์ที่รันโค้ดได้ออกทั้งหมด
 */
export function sanitizeSvg(svg: string): string {
  return svg
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<foreignObject[\s\S]*?<\/foreignObject>/gi, '')
    .replace(/<!ENTITY[\s\S]*?>/gi, '')
    .replace(/\son\w+\s*=\s*"[^"]*"/gi, '')
    .replace(/\son\w+\s*=\s*'[^']*'/gi, '')
    .replace(/(href|xlink:href)\s*=\s*["']\s*javascript:[^"']*["']/gi, '')
    .replace(/<\s*(iframe|embed|object|use)\b[^>]*>/gi, '');
}

/**
 * ลบไฟล์ — ตรวจก่อนว่ายังมีใครอ้างถึงอยู่หรือไม่
 * ลบภาพที่หน้าเว็บใช้อยู่จะทำให้เกิดรูปแตก ซึ่งผู้ดูแลมักไม่รู้ตัวจนมีคนทัก
 */
export async function deleteMedia(id: string): Promise<void> {
  const media = await prisma.media.findUnique({
    where: { id },
    include: {
      _count: {
        select: {
          avatarOf: true,
          teacherPhotos: true,
          studentPhotos: true,
          programImages: true,
          courseImages: true,
          newsCovers: true,
          activityCovers: true,
          projectCovers: true,
          facilityCovers: true,
          albumCovers: true,
          galleryImages: true,
        },
      },
    },
  });
  if (!media) throw ApiError.notFound('ไม่พบไฟล์ที่ต้องการลบ');

  const references = Object.values(media._count).reduce((sum, n) => sum + n, 0);
  if (references > 0) {
    throw ApiError.conflict(
      `ไฟล์นี้ถูกใช้งานอยู่ ${references} แห่ง กรุณานำออกจากเนื้อหาที่ใช้อยู่ก่อนจึงจะลบได้`,
    );
  }

  await prisma.media.update({ where: { id }, data: { deletedAt: new Date() } });

  // ลบไฟล์จริงออกจากดิสก์แบบ best-effort — ถ้าลบไม่ได้ก็ยังถือว่าลบสำเร็จในระบบ
  const base = path.resolve(env.UPLOAD_DIR);
  const target = path.resolve(base, media.filename);
  if (target.startsWith(base)) {
    await unlink(target).catch(() => undefined);
    if (media.thumbnailUrl && media.thumbnailUrl !== media.url) {
      const thumb = path.resolve(base, media.thumbnailUrl.replace('/uploads/', ''));
      if (thumb.startsWith(base)) await unlink(thumb).catch(() => undefined);
    }
  } else {
    logger.warn({ mediaId: id }, 'เส้นทางไฟล์อยู่นอกโฟลเดอร์อัปโหลด — ไม่ลบไฟล์จริง');
  }
}
