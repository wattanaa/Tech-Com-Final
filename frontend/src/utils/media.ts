const API_ORIGIN = (import.meta.env.VITE_API_BASE_URL ?? '/api/v1').replace(/\/api\/v1\/?$/, '');

/**
 * URL ของไฟล์ที่อัปโหลด (เช่น "/uploads/general/xxx.webp") เป็น path แบบ relative
 * เสมอ — บน dev/Fly.io frontend กับ backend เป็น same-origin (ผ่าน proxy) จึงใช้ได้ตรงๆ
 * แต่บน Render ที่ frontend เป็น static site คนละโดเมนกับ backend ต้องต่อ origin ของ
 * backend เข้าไปเอง ไม่งั้น browser จะไปหาไฟล์ที่ frontend เอง (404)
 */
export function resolveMediaUrl(url: string | null | undefined): string | undefined {
  if (!url) return undefined;
  if (/^https?:\/\//i.test(url) || url.startsWith('data:')) return url;
  return `${API_ORIGIN}${url}`;
}

/** true ถ้าเป็นไฟล์วิดีโอ (mp4/webm) — ใช้แยกว่าจะ render เป็น video tag แทน img tag */
export function isVideoMime(mimeType: string | null | undefined): boolean {
  return Boolean(mimeType?.startsWith('video/'));
}
