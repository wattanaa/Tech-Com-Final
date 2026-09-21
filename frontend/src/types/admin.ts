/** ชนิดข้อมูลฝั่งหลังบ้าน — ตรงกับที่ backend admin API ส่งกลับมา */

export interface LoginInput {
  email: string;
  password: string;
}

/** ข้อมูลผู้ใช้ปัจจุบันแบบเต็ม — ผลลัพธ์จาก GET /auth/me */
export interface AdminUser {
  id: string;
  email: string;
  name: string;
  phone: string | null;
  avatar: { id: string; url: string; thumbnailUrl: string | null } | null;
  lastLoginAt: string | null;
  role: { name: 'SUPER_ADMIN' | 'ADMIN' | 'EDITOR'; label: string; level: number };
  permissions: string[];
}
