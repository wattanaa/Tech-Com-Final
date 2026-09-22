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

/** mimeType พิเศษของวิดีโอ YouTube ที่ฝังด้วยลิงก์ — ต้องตรงกับ YOUTUBE_MIME ฝั่ง backend เป๊ะ */
const YOUTUBE_MIME = 'link/youtube';

/** true ถ้าเป็นวิดีโอ YouTube ที่ฝังด้วยลิงก์ (ไม่มีไฟล์จริง) — ต้อง render เป็น iframe ไม่ใช่ video tag */
export function isYoutubeMedia(mimeType: string | null | undefined): boolean {
  return mimeType === YOUTUBE_MIME;
}

/** ดึง video id จากลิงก์ YouTube ทุกรูปแบบที่พบบ่อย — คืน null ถ้าไม่ใช่ลิงก์ YouTube */
export function parseYoutubeId(url: string): string | null {
  try {
    const u = new URL(url.trim());
    const host = u.hostname.replace(/^www\.|^m\./, '');
    if (host === 'youtu.be') return u.pathname.slice(1).split('/')[0] || null;
    if (host === 'youtube.com') {
      if (u.pathname === '/watch') return u.searchParams.get('v');
      const match = u.pathname.match(/^\/(embed|shorts)\/([^/]+)/);
      if (match) return match[2] ?? null;
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * สร้าง URL สำหรับ iframe embed จาก Media.url ที่เก็บลิงก์ YouTube ไว้
 * params เพิ่มเติมสำหรับใช้เป็นพื้นหลัง (เล่นวนอัตโนมัติแบบไม่มีเสียง/ไม่มีปุ่มควบคุม)
 */
export function getYoutubeEmbedUrl(url: string, opts?: { background?: boolean }): string | null {
  const id = parseYoutubeId(url);
  if (!id) return null;
  const params = new URLSearchParams({ rel: '0', modestbranding: '1' });
  if (opts?.background) {
    params.set('autoplay', '1');
    params.set('mute', '1');
    params.set('loop', '1');
    params.set('controls', '0');
    params.set('playlist', id); // loop=1 ต้องมี playlist ชี้กลับมาที่วิดีโอเดียวกันถึงจะวนได้จริง
  }
  return `https://www.youtube-nocookie.com/embed/${id}?${params.toString()}`;
}
