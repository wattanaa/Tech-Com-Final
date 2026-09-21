import express, { type Express } from 'express';
import { randomUUID } from 'node:crypto';
import path from 'node:path';
import helmet from 'helmet';
import cors from 'cors';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import pinoHttp from 'pino-http';

import { env } from './config/env.js';
import { logger } from './utils/logger.js';
import routes from './routes/index.js';
import { errorHandler, notFoundHandler } from './middleware/error.middleware.js';
import { ApiError } from './utils/ApiError.js';
import { sessionMiddleware } from './config/session.js';
import { attachUser } from './middleware/auth.middleware.js';
import seoRoutes from './routes/seo.routes.js';

/**
 * ประกอบ Express app — ลำดับ middleware มีผลต่อความปลอดภัย จึงห้ามสลับตามใจ
 * helmet → cors → rateLimit → parser → requestId → logger → routes → 404 → error
 */
export function createApp(): Express {
  const app = express();

  // อยู่หลัง reverse proxy (nginx / Render) — จำเป็นต่อการอ่าน IP จริงและ secure cookie
  app.set('trust proxy', 1);
  app.disable('x-powered-by');

  // ── Security headers ──────────────────────────────────────
  app.use(
    helmet({
      contentSecurityPolicy: env.isProd ? undefined : false,
      crossOriginResourcePolicy: { policy: 'cross-origin' }, // ให้ frontend โหลดรูปจาก /uploads ได้
    }),
  );

  // ── CORS: เฉพาะโดเมนที่อยู่ใน .env และต้องส่ง cookie ได้ ──
  app.use(
    cors({
      origin(origin, callback) {
        if (!origin || env.corsOrigins.includes(origin)) return callback(null, true);
        callback(ApiError.forbidden('ไม่อนุญาตให้เรียกจากโดเมนนี้'));
      },
      credentials: true,
    }),
  );

  // ── Rate limit ระดับแอป (ยังมี limit เฉพาะ /auth/login อีกชั้นใน PHASE 4) ──
  app.use(
    '/api',
    rateLimit({
      windowMs: env.RATE_LIMIT_WINDOW_MINUTES * 60 * 1000,
      max: env.RATE_LIMIT_MAX,
      standardHeaders: true,
      legacyHeaders: false,
      handler: (_req, _res, next) => next(ApiError.tooManyRequests()),
    }),
  );

  // ── Parsers ───────────────────────────────────────────────
  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: true, limit: '1mb' }));
  app.use(cookieParser());
  app.use(compression());

  // ── Session + ผู้ใช้ปัจจุบัน ────────────────────────────────
  // ต้องมาหลัง cookieParser และก่อน routes ทุกตัว
  app.use(sessionMiddleware);
  app.use(attachUser);

  // ── Request ID + log ──────────────────────────────────────
  app.use((req, res, next) => {
    const id = randomUUID();
    (req as typeof req & { id: string }).id = id;
    res.setHeader('X-Request-Id', id);
    next();
  });
  app.use(
    pinoHttp({
      logger,
      genReqId: (req) => (req as typeof req & { id?: string }).id ?? randomUUID(),
      autoLogging: { ignore: (req) => req.url === '/api/v1/health' },
    }),
  );

  // ── Static: ไฟล์ที่อัปโหลด ────────────────────────────────
  app.use(
    '/uploads',
    express.static(path.resolve(env.UPLOAD_DIR), {
      maxAge: env.isProd ? '30d' : 0,
      setHeaders: (res) => {
        // ไม่ให้เบราว์เซอร์เดาชนิดไฟล์เอง และไม่ให้รันไฟล์ที่อัปโหลด
        res.setHeader('X-Content-Type-Options', 'nosniff');
      },
    }),
  );

  // ── Routes ────────────────────────────────────────────────
  // sitemap.xml / robots.txt อยู่ระดับ root ไม่ใช่ใต้ /api/v1
  app.use(seoRoutes);
  app.use('/api/v1', routes);

  // ── 404 + Global error handler (ต้องอยู่ท้ายสุดเสมอ) ──────
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
