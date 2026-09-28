-- แทนที่ enum ประเภทครู (Teacher.type) แบบตายตัว 3 ค่า ด้วยความสัมพันธ์ไปยัง
-- categories (type = 'TEACHER') ที่ผู้ดูแลระบบจัดการเองได้ผ่านหน้า Admin

-- AlterTable: เพิ่มคอลัมน์ใหม่ก่อน โดยยังไม่ลบของเดิม
ALTER TABLE "teachers" ADD COLUMN "typeId" TEXT;

-- สร้างหมวดหมู่ประเภทครูเริ่มต้น 3 แบบเดิม (idempotent — ข้ามถ้ามีอยู่แล้ว)
INSERT INTO "categories" ("id", "name", "slug", "type", "color", "order", "createdAt", "updatedAt")
SELECT gen_random_uuid()::text, 'หัวหน้าแผนก', 'head', 'TEACHER', '#0A84FF', 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM "categories" WHERE "slug" = 'head' AND "type" = 'TEACHER');

INSERT INTO "categories" ("id", "name", "slug", "type", "color", "order", "createdAt", "updatedAt")
SELECT gen_random_uuid()::text, 'ครูผู้สอน', 'teacher', 'TEACHER', '#0057B8', 2, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM "categories" WHERE "slug" = 'teacher' AND "type" = 'TEACHER');

INSERT INTO "categories" ("id", "name", "slug", "type", "color", "order", "createdAt", "updatedAt")
SELECT gen_random_uuid()::text, 'เจ้าหน้าที่', 'staff', 'TEACHER', '#0E9C63', 3, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM "categories" WHERE "slug" = 'staff' AND "type" = 'TEACHER');

-- ย้ายข้อมูลเดิม: จับคู่ค่า enum เก่า (HEAD/TEACHER/STAFF) กับหมวดหมู่ที่เพิ่งสร้าง
UPDATE "teachers" t
SET "typeId" = c."id"
FROM "categories" c
WHERE c."type" = 'TEACHER'
  AND c."slug" = CASE t."type"
    WHEN 'HEAD' THEN 'head'
    WHEN 'STAFF' THEN 'staff'
    ELSE 'teacher'
  END;

-- ลบคอลัมน์ enum เดิมและ enum type ที่ไม่ใช้แล้ว
DROP INDEX IF EXISTS "teachers_type_order_idx";
ALTER TABLE "teachers" DROP COLUMN "type";
DROP TYPE "TeacherType";

-- ผูก FK + index ให้คอลัมน์ใหม่
ALTER TABLE "teachers" ADD CONSTRAINT "teachers_typeId_fkey" FOREIGN KEY ("typeId") REFERENCES "categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;
CREATE INDEX "teachers_typeId_order_idx" ON "teachers"("typeId", "order");
