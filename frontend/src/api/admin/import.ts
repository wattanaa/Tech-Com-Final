import { apiClient } from '../client';

export interface ImportRowIssue {
  row: number;
  message: string;
}

export interface ImportResult {
  total: number;
  created: number;
  errors: ImportRowIssue[];
  warnings: ImportRowIssue[];
}

async function uploadImportFile(url: string, file: File): Promise<ImportResult> {
  const form = new FormData();
  form.append('file', file);
  const res = await apiClient.post<{ data: ImportResult }>(url, form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return res.data.data;
}

/** ดาวน์โหลดไฟล์แล้วสั่งเซฟลงเครื่องผู้ใช้ทันที (ไม่เปิดแท็บใหม่) */
async function downloadFile(url: string, filename: string): Promise<void> {
  const res = await apiClient.get<Blob>(url, { responseType: 'blob' });
  const objectUrl = URL.createObjectURL(res.data);
  const link = document.createElement('a');
  link.href = objectUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(objectUrl);
}

export const importTeachers = (file: File) => uploadImportFile('/admin/import/teachers', file);
export const downloadTeacherImportTemplate = () =>
  downloadFile('/admin/import/teachers/template', 'teacher-import-template.xlsx');

export const importStudents = (file: File) => uploadImportFile('/admin/import/students', file);
export const downloadStudentImportTemplate = () =>
  downloadFile('/admin/import/students/template', 'student-import-template.xlsx');
