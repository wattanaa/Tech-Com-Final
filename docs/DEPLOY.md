# คู่มือการนำเว็บไซต์ขึ้นใช้งานจริง (Deployment)

เว็บไซต์แผนกวิชาเทคโนโลยีคอมพิวเตอร์ วิทยาลัยเทคนิคร้อยเอ็ด

มี 3 ทางเลือก เลือกตามความถนัดและอุปกรณ์ที่มี

| ทางเลือก | เหมาะกับ | ความยาก | ค่าใช้จ่าย |
|---|---|:---:|---|
| **A. Docker คำสั่งเดียว** | มีเครื่อง server / VPS ของตนเอง | ง่ายมาก | ค่าเช่า VPS |
| **B. Fly.io (คลาวด์ แนะนำ)** | อยากได้ URL ใช้ทันที ไม่มี server | ง่าย | ตามการใช้งานจริง (เล็กน้อย) |
| **C. ติดตั้งเอง (Manual)** | อยากเข้าใจทุกขั้นตอน / ปรับแต่งลึก | ปานกลาง | แล้วแต่ host |

> **หมายเหตุ:** เดิมโปรเจกต์นี้ใช้ Render.com (ดู `render.yaml`) แต่ย้ายมาใช้ Fly.io แทน
> เพราะ Render free tier ระงับบริการเองเมื่อไม่ได้ใช้งานนาน ๆ และไฟล์อัปโหลดไม่ถาวร
> `render.yaml` ยังอยู่ในโปรเจกต์เผื่ออ้างอิง แต่ไม่ได้ดูแลต่อแล้ว

---

## ทางเลือก A — Docker คำสั่งเดียว (แนะนำ)

เหมาะกับการติดตั้งบน VPS (เช่น DigitalOcean, AWS Lightsail) หรือเครื่อง server ของวิทยาลัย
ระบบทั้งหมด — ฐานข้อมูล, API, เว็บ — ทำงานในชุดเดียว สร้างตารางและใส่ข้อมูลตั้งต้นให้อัตโนมัติ

**สิ่งที่ต้องมี:** [Docker](https://docs.docker.com/get-docker/) (รวม Docker Compose v2 มาให้แล้ว)

```bash
# 1. ดึงโค้ดลงเครื่อง
git clone https://github.com/wattanaa/TCOM.git
cd TCOM

# 2. รันสคริปต์ติดตั้ง — สุ่มค่าความปลอดภัยให้อัตโนมัติ ถามแค่รหัสผ่านผู้ดูแล
./deploy.sh
```

เท่านี้เสร็จ เปิดเว็บที่ **http://\<ไอพีเครื่อง\>/** หรือ **http://localhost/**

<details>
<summary>หรือจะตั้งค่าเองทีละขั้นก็ได้</summary>

```bash
cp .env.prod.example .env
nano .env          # กรอก POSTGRES_PASSWORD, SESSION_SECRET, SEED_ADMIN_PASSWORD

# สุ่ม SESSION_SECRET:
docker run --rm node:20-slim node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"

docker compose -f docker-compose.prod.yml up -d --build
```
</details>

**คำสั่งที่ใช้บ่อย**

```bash
docker compose -f docker-compose.prod.yml logs -f      # ดู log
docker compose -f docker-compose.prod.yml down         # ปิดระบบ (ข้อมูลยังอยู่)
docker compose -f docker-compose.prod.yml up -d --build # อัปเดตหลังแก้โค้ด
```

**การเปิดใช้ HTTPS** — แนะนำวาง [Caddy](https://caddyserver.com/) หรือ Nginx Proxy Manager
ไว้ด้านหน้าเพื่อขอใบรับรอง SSL อัตโนมัติ แล้วชี้มาที่พอร์ต `WEB_PORT`
อย่าลืมตั้ง `CORS_ORIGIN` ใน `.env` ให้เป็นโดเมนจริง เช่น `https://tcom.rtc.ac.th`

---

## ทางเลือก B — Fly.io (คลาวด์ แนะนำ)

Backend และ frontend รันเป็นแอปแยกกันบน Fly เชื่อมกันผ่านเครือข่ายภายใน (6PN) แบบ
same-origin เหมือนตอน dev เลย (nginx ฝั่ง frontend proxy `/api` และ `/uploads` ไป backend
โดยตรง) จึง **ไม่ต้องพึ่ง CORS** และไฟล์อัปโหลดเก็บถาวรผ่าน Fly Volume ไม่หายตอน redeploy

**สิ่งที่ต้องมี:** บัญชี [Fly.io](https://fly.io) (ต้องผูกบัตรเครดิตแม้ใช้งานน้อย) และ
[flyctl](https://fly.io/docs/flyctl/install/)

```bash
# 1. ติดตั้งและล็อกอิน flyctl (ทำครั้งเดียว)
curl -L https://fly.io/install.sh | sh     # หรือ: iwr https://fly.io/install.ps1 -useb | iex
fly auth login

# 2. สร้างฐานข้อมูล Postgres บน Fly (เลือก plan เล็กสุดพอสำหรับเริ่มต้น)
fly postgres create --name tcom-db-rtc --region sin --vm-size shared-cpu-1x --initial-cluster-size 1

# 3. Deploy backend — ใช้ค่าจาก backend/fly.toml (แก้ชื่อแอปในไฟล์นี้ก่อนถ้าชื่อซ้ำคนอื่น)
cd backend
fly apps create tcom-api-rtc          # ข้ามได้ถ้าใช้ `fly launch` แทน
fly postgres attach tcom-db-rtc --app tcom-api-rtc     # ตั้ง DATABASE_URL ให้อัตโนมัติ
fly volumes create tcom_uploads --app tcom-api-rtc --region sin --size 1
fly secrets set --app tcom-api-rtc \
  SESSION_SECRET="$(openssl rand -hex 48)" \
  SEED_ADMIN_PASSWORD="ตั้งรหัสผ่านผู้ดูแลอย่างน้อย 12 ตัวอักษร"
fly deploy --app tcom-api-rtc

# 4. Deploy frontend — ใช้ค่าจาก frontend/fly.toml
cd ../frontend
fly apps create tcom-web-rtc
fly deploy --app tcom-web-rtc
```

**หลัง deploy ครั้งแรก** ตรวจว่าชื่อแอปที่ได้จริงตรงกับที่อ้างถึงกันหรือไม่ (ชื่อบน Fly
ต้อง unique ทั้งระบบ ถ้าชื่อที่ตั้งไว้ในไฟล์ `fly.toml` ถูกใช้แล้ว Fly จะขอให้เปลี่ยน):

- `frontend/fly.toml` → `BACKEND_INTERNAL_HOST` ต้องเป็น `<ชื่อแอป backend จริง>.internal`
- `backend/fly.toml` → `CORS_ORIGIN` ควรตรงกับ `https://<ชื่อแอป frontend จริง>.fly.dev`
  (ใช้เป็น fallback เท่านั้น เพราะ path หลักผ่าน nginx proxy แบบ same-origin อยู่แล้ว)

แก้แล้วรัน `fly deploy --app <ชื่อแอปนั้น>` ใหม่อีกครั้งให้ค่าอัปเดต

**คำสั่งที่ใช้บ่อย**

```bash
fly logs --app tcom-api-rtc          # ดู log backend
fly status --app tcom-api-rtc        # เช็คสถานะเครื่อง
fly deploy --app tcom-api-rtc        # deploy ใหม่หลังแก้โค้ด
fly ssh console --app tcom-api-rtc   # เข้าไปดูข้างในเครื่องถ้าต้อง debug
```

---

## ทางเลือก C — ติดตั้งเอง (Manual)

เหมาะกับผู้ที่ต้องการควบคุมทุกขั้นตอน หรือ host ที่แยกส่วนกัน
(Frontend บน Vercel/Netlify · Backend บน Railway/VPS · Database เป็น PostgreSQL แยก)

ดูขั้นตอนการติดตั้งแบบ dev และ build ได้ใน [README.md](../README.md)
สรุปสำหรับ production:

```bash
# ── Backend ──
cd backend
npm ci
cp .env.example .env          # กรอกค่าให้ครบ โดยเฉพาะ DATABASE_URL, SESSION_SECRET
npm run build                 # คอมไพล์ TypeScript → dist/
npx prisma migrate deploy     # หรือ  npx prisma db push  ถ้ายังไม่มี migration
npm run db:seed -- --core-only
npm start                     # รัน node dist/server.js (แนะนำใช้ pm2 คุมโปรเซส)

# ── Frontend ──
cd ../frontend
npm ci
# ตั้ง VITE_API_BASE_URL ใน .env ให้ชี้ไปที่ URL ของ backend เช่น https://api.example.com/api/v1
npm run build                 # ได้ไฟล์ static ใน dist/ นำไปวางบน host หรือ CDN ได้เลย
```

---

## เช็กลิสต์ก่อนขึ้นใช้งานจริง

- [ ] ตั้ง `SEED_MODE=core` เพื่อไม่ให้มีข้อมูลตัวอย่างปนกับข้อมูลจริง
      (ถ้าเคยรันแบบ `demo` มาก่อน ให้ล้างด้วย `npm run db:reset` หรือสร้างฐานข้อมูลใหม่)
- [ ] เปลี่ยนรหัสผ่านผู้ดูแลทันทีหลังเข้าระบบครั้งแรก
- [ ] ตั้ง `CORS_ORIGIN` เป็นโดเมนจริง ไม่ใช่ `localhost`
- [ ] เปิด HTTPS (จำเป็นต่อความปลอดภัยของ session cookie)
- [ ] ตั้งค่าการสำรองข้อมูลฐานข้อมูลเป็นประจำ
- [ ] ตรวจว่าโฟลเดอร์ `uploads/` ถูกเก็บถาวร (mount volume หรือ disk)

> รายละเอียดด้านความปลอดภัย (CIA) อยู่ใน [ARCHITECTURE.md](ARCHITECTURE.md) หัวข้อ 10
