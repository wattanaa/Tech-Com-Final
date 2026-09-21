import { useState } from 'react';
import { History, RotateCcw } from 'lucide-react';
import type { ContentVersionSummary } from '@/api/admin/resource';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/feedback';
import { useConfirm } from '../ConfirmDialog';
import { useToast } from '../Toast';
import { ApiClientError } from '@/api/client';

/** รายการเวอร์ชันย้อนหลังของเนื้อหาที่ versioned:true — กู้คืนเวอร์ชันเก่าได้ทันทีหลังยืนยัน */
export function VersionHistoryPanel({
  versions,
  isLoading,
  onRestore,
  isRestoring,
}: {
  versions: ContentVersionSummary[] | undefined;
  isLoading: boolean;
  onRestore: (version: number) => Promise<void>;
  isRestoring: boolean;
}) {
  const confirm = useConfirm();
  const toast = useToast();
  const [restoringVersion, setRestoringVersion] = useState<number | null>(null);

  const handleRestore = async (version: number) => {
    const ok = await confirm({
      title: `กู้คืนเป็นเวอร์ชัน ${version} ?`,
      message: 'ข้อมูลปัจจุบันจะถูกแทนที่ด้วยข้อมูลของเวอร์ชันนี้ (ระบบจะบันทึกสถานะปัจจุบันเป็นเวอร์ชันใหม่ก่อนเสมอ ย้อนกลับได้)',
      confirmLabel: 'กู้คืน',
    });
    if (!ok) return;
    setRestoringVersion(version);
    try {
      await onRestore(version);
      toast.success(`กู้คืนเป็นเวอร์ชัน ${version} สำเร็จ`);
    } catch (err) {
      toast.error(err instanceof ApiClientError ? err.message : 'กู้คืนไม่สำเร็จ');
    } finally {
      setRestoringVersion(null);
    }
  };

  if (isLoading) return <Spinner label="กำลังโหลดประวัติเวอร์ชัน" />;

  if (!versions || versions.length === 0) {
    return (
      <p className="flex items-center gap-2 text-sm text-ink-subtle">
        <History className="size-4" aria-hidden />
        ยังไม่มีประวัติการแก้ไข
      </p>
    );
  }

  return (
    <ul className="flex flex-col divide-y divide-hairline/10">
      {versions.map((v) => (
        <li key={v.id} className="flex items-center justify-between gap-3 py-2.5 text-sm">
          <div>
            <p className="font-medium text-ink">เวอร์ชัน {v.version}</p>
            <p className="text-xs text-ink-subtle">
              {v.changedBy?.name ?? 'ระบบ'} ·{' '}
              {new Date(v.createdAt).toLocaleString('th-TH', { dateStyle: 'short', timeStyle: 'short' })}
              {v.note ? ` · ${v.note}` : ''}
            </p>
          </div>
          <Button
            variant="ghost"
            size="xs"
            isLoading={isRestoring && restoringVersion === v.version}
            onClick={() => handleRestore(v.version)}
            leftIcon={<RotateCcw className="size-3.5" aria-hidden />}
          >
            กู้คืน
          </Button>
        </li>
      ))}
    </ul>
  );
}
