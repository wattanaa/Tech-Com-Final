# ────────────────────────────────────────────────────────────
#  FRONTEND IMAGE — TCOM Web
#  Build เว็บด้วย Vite แล้วเสิร์ฟไฟล์ static ผ่าน nginx
#  nginx ทำหน้าที่ proxy /api และ /uploads ไปยัง backend ในเครือข่ายเดียวกัน
# ────────────────────────────────────────────────────────────

# ---- ขั้นที่ 1: build ----
FROM node:20-slim AS build
WORKDIR /app

COPY package.json ./
# npm 10.x ที่มากับ image นี้มีบั๊ก arborist (Cannot read properties of null (reading 'edgesOut'))
# กับ dependency tree ของโปรเจกต์นี้ — อัปเป็น npm 11 ก่อนติดตั้งเพื่อเลี่ยงปัญหา
RUN npm install -g npm@11 && npm install

COPY . .
# ระหว่าง build ให้ frontend เรียก API แบบ same-origin (/api/v1) แล้วให้ nginx proxy ต่อ
ENV VITE_API_BASE_URL=/api/v1
RUN npm run build

# ---- ขั้นที่ 2: เสิร์ฟด้วย nginx ----
FROM nginx:1.27-alpine AS runtime
COPY --from=build /app/dist /usr/share/nginx/html
# ใช้ template + envsubst (มีอยู่แล้วใน image นี้) เพื่อให้เปลี่ยน backend host ได้ตอนรัน
# โดยไม่ต้องแก้ไฟล์ config — ค่าเริ่มต้นตรงกับ docker-compose.prod.yml (service name "backend")
# บน Fly.io ให้ override เป็นชื่อ .internal ของแอป backend ผ่าน [env] ใน fly.toml
COPY nginx.conf.template /etc/nginx/templates/default.conf.template
ENV BACKEND_INTERNAL_HOST=backend
ENV BACKEND_INTERNAL_PORT=4000
ENV RESOLVER=127.0.0.11

EXPOSE 80
HEALTHCHECK --interval=30s --timeout=5s --retries=3 \
  CMD wget -q -O /dev/null http://localhost/ || exit 1
