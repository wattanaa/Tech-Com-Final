/** ฟังก์ชันช่วยจัดรูปแบบข้อมูลให้อยู่ในรูปแบบไทย */

const TH_MONTHS = [
  'ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.',
  'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.',
];
const TH_MONTHS_FULL = [
  'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
  'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม',
];

/** วันที่แบบไทยย่อ เช่น "12 ก.ย. 2569" (แปลงเป็น พ.ศ. ให้อัตโนมัติ) */
export function thaiDate(input?: string | null, full = false): string {
  if (!input) return '';
  const d = new Date(input);
  if (Number.isNaN(d.getTime())) return '';
  const months = full ? TH_MONTHS_FULL : TH_MONTHS;
  return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear() + 543}`;
}

/** ตัวเลขคั่นหลักพันแบบไทย เช่น 1,204 */
export function thaiNumber(n: number): string {
  return n.toLocaleString('th-TH');
}

/** ชื่อเต็มของบุคคล */
export function fullName(p?: { prefix?: string; firstName: string; lastName: string } | null): string {
  if (!p) return '';
  return `${p.prefix ?? ''}${p.firstName} ${p.lastName}`.trim();
}

/** อักษรย่อสำหรับ avatar เมื่อไม่มีรูป */
export function initials(name: string): string {
  return name.replace(/^(นาย|นาง|นางสาว|ดร\.|ผศ\.|รศ\.|ศ\.)/, '').trim().charAt(0) || '?';
}

export const PROGRAM_LEVEL_LABEL: Record<string, string> = {
  POR_WOR_CHOR: 'ปวช.',
  POR_WOR_SOR: 'ปวส.',
};
