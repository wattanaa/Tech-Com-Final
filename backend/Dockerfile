# ────────────────────────────────────────────────────────────
#  BACKEND IMAGE — TCOM API
#  Build:  docker build -t tcom-api ./backend
#  หลายขั้น (multi-stage) เพื่อให้ image สุดท้ายเล็กและปลอดภัย
# ────────────────────────────────────────────────────────────

# ---- ขั้นที่ 1: ติดตั้ง dependency + build TypeScript ----
FROM node:20-slim AS build
WORKDIR /app

# openssl จำเป็นสำหรับ Prisma engine
RUN apt-get update -y && apt-get install -y --no-install-recommends openssl \
  && rm -rf /var/lib/apt/lists/*

COPY package.json ./
RUN npm install

COPY prisma ./prisma
RUN npx prisma generate

COPY tsconfig.json ./
COPY src ./src
RUN npm run build

# ---- ขั้นที่ 2: image สำหรับรันจริง ----
FROM node:20-slim AS runtime
WORKDIR /app
ENV NODE_ENV=production

RUN apt-get update -y && apt-get install -y --no-install-recommends openssl \
  && rm -rf /var/lib/apt/lists/*

# คัดลอกทุกอย่างที่จำเป็นจากขั้น build
# (ไม่ prune dev dependency เพราะ entrypoint ต้องใช้ prisma CLI และ tsx ตอน migrate/seed —
#  ด้วยเหตุผลเดียวกัน ต้องคัดลอก src/ มาด้วย เพราะ prisma/seeds/*.ts import จาก ../../src/... ตรง ๆ
#  ให้ tsx รันจาก source จริงตอน seed ไม่ใช่จาก dist/ ที่ compile แล้ว)
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY --from=build /app/src ./src
COPY --from=build /app/prisma ./prisma
COPY --from=build /app/package.json ./package.json
COPY --from=build /app/tsconfig.json ./tsconfig.json
COPY docker-entrypoint.sh ./docker-entrypoint.sh

# โฟลเดอร์เก็บไฟล์อัปโหลดและ backup (จะถูก mount เป็น volume ตอนใช้งานจริง)
RUN mkdir -p uploads backups && chmod +x docker-entrypoint.sh

EXPOSE 4000

# ตรวจสุขภาพระบบผ่าน endpoint /health — ให้ host รู้ว่าพร้อมให้บริการหรือยัง
HEALTHCHECK --interval=30s --timeout=5s --start-period=40s --retries=3 \
  CMD node -e "fetch('http://localhost:'+(process.env.PORT||4000)+'/api/v1/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

ENTRYPOINT ["./docker-entrypoint.sh"]
