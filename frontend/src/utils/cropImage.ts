export interface CropPixels {
  x: number;
  y: number;
  width: number;
  height: number;
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.addEventListener('load', () => resolve(img));
    img.addEventListener('error', () => reject(new Error('โหลดรูปภาพไม่สำเร็จ')));
    img.src = src;
  });
}

/**
 * ครอปภาพตามพิกัดที่เลือก แล้วย่อขนาดตาม outputWidth (ถ้าระบุ) ก่อนส่งออกเป็นไฟล์
 * ทำทั้งหมดฝั่ง client ด้วย canvas — เซิร์ฟเวอร์จะเข้ารหัสเป็น WebP ซ้ำอีกชั้นอยู่แล้ว
 * ส่งออกเป็น PNG (ไม่ใช่ JPEG) เพื่อรักษาพื้นหลังโปร่งใส — แคนวาสเริ่มต้นเป็นโปร่งใส
 * และ JPEG ไม่รองรับ alpha channel เลย ถ้าใช้ JPEG พื้นหลังโปร่งใสจะถูกเติมทึบตรงนี้ทันที
 * ก่อนถึงเซิร์ฟเวอร์ด้วยซ้ำ แก้ตอนนั้นไม่ทันแล้ว
 */
export async function createCroppedImageBlob(
  imageSrc: string,
  crop: CropPixels,
  outputWidth?: number,
): Promise<Blob> {
  const image = await loadImage(imageSrc);
  const canvas = document.createElement('canvas');
  const targetWidth = outputWidth && outputWidth > 0 ? Math.min(outputWidth, crop.width) : crop.width;
  const scale = targetWidth / crop.width;

  canvas.width = Math.round(targetWidth);
  canvas.height = Math.round(crop.height * scale);

  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('ไม่สามารถสร้างรูปที่ครอปได้');
  ctx.drawImage(image, crop.x, crop.y, crop.width, crop.height, 0, 0, canvas.width, canvas.height);

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error('สร้างไฟล์ภาพไม่สำเร็จ'))),
      'image/png',
    );
  });
}
