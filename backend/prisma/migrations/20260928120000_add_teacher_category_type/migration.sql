-- AlterEnum
-- Postgres ไม่ให้ใช้ค่า enum ใหม่ในทรานแซกชันเดียวกับที่เพิ่มมัน
-- จึงแยกเป็น migration นี้ไว้ต่างหาก ก่อน migration ที่จะใช้ค่า TEACHER จริง
ALTER TYPE "CategoryType" ADD VALUE 'TEACHER';
