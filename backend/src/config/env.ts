import 'dotenv/config';
import { z } from 'zod';

/**
 * ตรวจสอบ environment variable ทั้งหมดตั้งแต่ตอน boot
 * ถ้าขาดหรือผิดรูปแบบ แอปจะหยุดทันทีพร้อมบอกว่าตัวไหนผิด
 * ดีกว่าปล่อยให้ไปพังตอน runtime
 */
const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(4000),
  CORS_ORIGIN: z.string().default('http://localhost:5173'),

  DATABASE_URL: z.string().min(1, 'ต้องกำหนด DATABASE_URL'),

  SESSION_SECRET: z
    .string()
    .min(32, 'SESSION_SECRET ต้องยาวอย่างน้อย 32 ตัวอักษร — สร้างด้วย crypto.randomBytes(48)'),
  SESSION_NAME: z.string().default('tcom.sid'),
  SESSION_MAX_AGE_HOURS: z.coerce.number().positive().default(8),

  UPLOAD_DIR: z.string().default('./uploads'),
  MAX_UPLOAD_SIZE_MB: z.coerce.number().positive().default(5),
  MAX_VIDEO_UPLOAD_SIZE_MB: z.coerce.number().positive().default(50),
  ALLOWED_MIME: z
    .string()
    .default('image/jpeg,image/png,image/webp,image/svg+xml,image/gif,video/mp4,video/webm'),

  BACKUP_DIR: z.string().default('./backups'),

  RATE_LIMIT_WINDOW_MINUTES: z.coerce.number().positive().default(15),
  RATE_LIMIT_MAX: z.coerce.number().positive().default(300),
  LOGIN_RATE_LIMIT_MAX: z.coerce.number().positive().default(5),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  // eslint-disable-next-line no-console
  console.error('\n❌ ตั้งค่า environment ไม่ถูกต้อง — ตรวจไฟล์ .env อีกครั้ง\n');
  for (const issue of parsed.error.issues) {
    // eslint-disable-next-line no-console
    console.error(`   • ${issue.path.join('.')}: ${issue.message}`);
  }
  // eslint-disable-next-line no-console
  console.error('\n   ดูตัวอย่างได้ที่ backend/.env.example\n');
  process.exit(1);
}

const raw = parsed.data;

export const env = {
  ...raw,
  isProd: raw.NODE_ENV === 'production',
  isDev: raw.NODE_ENV === 'development',
  corsOrigins: raw.CORS_ORIGIN.split(',').map((o) => o.trim()).filter(Boolean),
  allowedMimeTypes: raw.ALLOWED_MIME.split(',').map((m) => m.trim()).filter(Boolean),
  maxUploadBytes: raw.MAX_UPLOAD_SIZE_MB * 1024 * 1024,
  maxVideoUploadBytes: raw.MAX_VIDEO_UPLOAD_SIZE_MB * 1024 * 1024,
  sessionMaxAgeMs: raw.SESSION_MAX_AGE_HOURS * 60 * 60 * 1000,
} as const;

export type Env = typeof env;
