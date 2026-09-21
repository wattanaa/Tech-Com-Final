import type { ContentStatus } from '@/api/admin/resource';
import { PUBLISH_GATED_STATUSES, STATUS_COLOR, STATUS_LABEL, WORKFLOW_TRANSITIONS } from '@/config/workflow';
import { useAdminAuth } from '@/contexts/AdminAuthContext';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { useToast } from '../Toast';
import { ApiClientError } from '@/api/client';

/** ปุ่มเปลี่ยนสถานะตาม workflow ที่ backend อนุญาต — ซ่อนปุ่มที่ผู้ใช้ไม่มีสิทธิ์ทำได้ */
export function StatusWorkflowControl({
  status,
  permissionGroup,
  onChange,
  isChanging,
}: {
  status: ContentStatus;
  permissionGroup: string;
  onChange: (next: ContentStatus) => Promise<void>;
  isChanging: boolean;
}) {
  const { can } = useAdminAuth();
  const toast = useToast();
  const nextOptions = WORKFLOW_TRANSITIONS[status].filter(
    (next) => !PUBLISH_GATED_STATUSES.includes(next) || can(`${permissionGroup}:publish`),
  );

  const handleClick = async (next: ContentStatus) => {
    try {
      await onChange(next);
      toast.success(`เปลี่ยนสถานะเป็น "${STATUS_LABEL[next]}" แล้ว`);
    } catch (err) {
      toast.error(err instanceof ApiClientError ? err.message : 'เปลี่ยนสถานะไม่สำเร็จ');
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-2.5">
      <Badge color={STATUS_COLOR[status]}>{STATUS_LABEL[status]}</Badge>
      {nextOptions.map((next) => (
        <Button key={next} size="xs" variant="outline" isLoading={isChanging} onClick={() => handleClick(next)}>
          {next === 'PUBLISHED' ? 'เผยแพร่' : `ย้ายไป ${STATUS_LABEL[next]}`}
        </Button>
      ))}
    </div>
  );
}
