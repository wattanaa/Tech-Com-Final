import session from 'express-session';
import connectPgSimple from 'connect-pg-simple';
import { env } from './env.js';

/**
 * Session เก็บในตาราง PostgreSQL ไม่ใช่หน่วยความจำ
 * ข้อดี: รีสตาร์ตเซิร์ฟเวอร์แล้วผู้ใช้ไม่หลุด · scale หลาย instance ได้ ·
 *        และที่สำคัญคือ "เพิกถอนได้ทันที" ซึ่ง JWT ทำไม่ได้
 *
 * cookie ตั้งเป็น httpOnly จึงอ่านด้วย JavaScript ไม่ได้ — สคริปต์ XSS ขโมย session ไม่ได้
 */
const PgStore = connectPgSimple(session);

export const sessionMiddleware = session({
  name: env.SESSION_NAME,
  secret: env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  rolling: true, // ต่ออายุทุกครั้งที่ใช้งาน — คนที่ทำงานอยู่จะไม่หลุดกลางคัน
  store: new PgStore({
    conString: env.DATABASE_URL,
    tableName: 'user_sessions',
    createTableIfMissing: true,
    pruneSessionInterval: 60 * 15, // ล้าง session หมดอายุทุก 15 นาที
  }),
  cookie: {
    httpOnly: true,
    secure: env.isProd, // ส่งผ่าน HTTPS เท่านั้นตอน production
    // dev: frontend เรียกผ่าน Vite proxy เป็น same-origin จึงใช้ 'lax' ได้และปลอดภัยกว่า
    // prod: frontend (เช่น Render static site) กับ backend อยู่คนละโดเมนกันจริง ๆ
    // ต้องใช้ 'none' (คู่กับ secure:true เสมอ) ไม่งั้น browser จะไม่ส่ง cookie ข้าม origin เลย
    sameSite: env.isProd ? 'none' : 'lax',
    maxAge: env.sessionMaxAgeMs,
    path: '/',
  },
});
