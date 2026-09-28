import { useRef, useState } from 'react';
import { Upload, Download, FileSpreadsheet, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { Modal } from './Modal';
import { Button } from '@/components/ui/Button';
import { useToast } from './Toast';
import { ApiClientError } from '@/api/client';
import type { ImportResult } from '@/api/admin/import';

interface ImportModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  onImport: (file: File) => Promise<ImportResult>;
  onDownloadTemplate: () => Promise<void>;
  /** เรียกหลังนำเข้าสำเร็จอย่างน้อย 1 แถว — ใช้รีเฟรชรายการด้านหลัง */
  onImported?: () => void;
}

/**
 * กล่องนำเข้าข้อมูลจากไฟล์ Excel — ใช้ร่วมกันได้กับทุกหน้าที่รองรับการนำเข้าเป็นชุด
 * (เพิ่มข้อมูลใหม่เท่านั้น ไม่แก้ไขของเดิม) ดาวน์โหลดไฟล์ตัวอย่างได้จากในกล่องเดียวกัน
 */
export function ImportModal({ open, onClose, title, description, onImport, onDownloadTemplate, onImported }: ImportModalProps) {
  const toast = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);

  const reset = () => {
    setFile(null);
    setResult(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleDownloadTemplate = async () => {
    setIsDownloading(true);
    try {
      await onDownloadTemplate();
    } catch (err) {
      toast.error(err instanceof ApiClientError ? err.message : 'ดาวน์โหลดไฟล์ตัวอย่างไม่สำเร็จ');
    } finally {
      setIsDownloading(false);
    }
  };

  const handleImport = async () => {
    if (!file) return;
    setIsImporting(true);
    try {
      const res = await onImport(file);
      setResult(res);
      if (res.created > 0) {
        onImported?.();
        toast.success(`นำเข้าข้อมูลสำเร็จ ${res.created} รายการ`);
      } else {
        toast.error('ไม่มีแถวใดนำเข้าสำเร็จ — ดูรายละเอียดด้านล่าง');
      }
    } catch (err) {
      toast.error(err instanceof ApiClientError ? err.message : 'นำเข้าไฟล์ไม่สำเร็จ กรุณาลองใหม่อีกครั้ง');
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <Modal open={open} onClose={handleClose} title={title} size="lg">
      <div className="flex flex-col gap-4">
        {description && <p className="text-sm text-ink-muted">{description}</p>}

        <div className="flex flex-col gap-3 rounded-lg border border-dashed border-hairline/25 p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-[13px] text-ink-muted">
              <FileSpreadsheet className="size-4 shrink-0 text-brand-500" aria-hidden />
              ยังไม่มีไฟล์? ดาวน์โหลดไฟล์ตัวอย่างแล้วกรอกตามหัวคอลัมน์เดิม
            </div>
            <Button
              variant="outline"
              size="sm"
              leftIcon={<Download className="size-4" aria-hidden />}
              isLoading={isDownloading}
              onClick={handleDownloadTemplate}
            >
              ดาวน์โหลดไฟล์ตัวอย่าง
            </Button>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx"
            onChange={(e) => {
              setFile(e.target.files?.[0] ?? null);
              setResult(null);
            }}
            className="block w-full text-[13px] text-ink-muted file:mr-3 file:rounded-sm file:border-0 file:bg-brand-500/[0.10] file:px-3.5 file:py-2 file:text-[13px] file:font-semibold file:text-brand-500 hover:file:bg-brand-500/[0.16]"
          />
        </div>

        {result && (
          <div className="flex flex-col gap-3 rounded-lg bg-brand-500/[0.05] p-4 text-sm">
            <div className="flex items-center gap-2 font-semibold text-ink">
              <CheckCircle2 className="size-4 shrink-0 text-success" aria-hidden />
              นำเข้าสำเร็จ {result.created} จาก {result.total} แถว
            </div>
            {result.warnings.length > 0 && (
              <div>
                <p className="mb-1 flex items-center gap-1.5 font-medium text-warning">
                  <AlertTriangle className="size-3.5 shrink-0" aria-hidden /> ข้อสังเกต ({result.warnings.length})
                </p>
                <ul className="max-h-32 space-y-1 overflow-y-auto text-[13px] text-ink-muted">
                  {result.warnings.map((w, i) => (
                    <li key={i}>แถว {w.row}: {w.message}</li>
                  ))}
                </ul>
              </div>
            )}
            {result.errors.length > 0 && (
              <div>
                <p className="mb-1 flex items-center gap-1.5 font-medium text-danger">
                  <AlertTriangle className="size-3.5 shrink-0" aria-hidden /> ข้ามไป ({result.errors.length})
                </p>
                <ul className="max-h-32 space-y-1 overflow-y-auto text-[13px] text-ink-muted">
                  {result.errors.map((e, i) => (
                    <li key={i}>แถว {e.row}: {e.message}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        <div className="flex justify-end gap-2 border-t border-hairline/[0.13] pt-4">
          <Button variant="ghost" onClick={handleClose}>ปิด</Button>
          <Button
            leftIcon={<Upload className="size-4" aria-hidden />}
            isLoading={isImporting}
            disabled={!file}
            onClick={handleImport}
          >
            นำเข้าข้อมูล
          </Button>
        </div>
      </div>
    </Modal>
  );
}
