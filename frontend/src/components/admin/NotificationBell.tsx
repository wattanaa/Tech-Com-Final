import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Bell, CheckCheck } from 'lucide-react';
import { Spinner } from '@/components/ui/feedback';
import {
  listNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  type NotificationRow,
} from '@/api/admin/notifications';

const QUERY_KEY = ['admin', 'notifications'] as const;

export function NotificationBell() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: QUERY_KEY,
    queryFn: () => listNotifications({ limit: 10 }),
    refetchInterval: 60_000,
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: QUERY_KEY });
  const readMutation = useMutation({ mutationFn: markNotificationRead, onSuccess: invalidate });
  const readAllMutation = useMutation({ mutationFn: markAllNotificationsRead, onSuccess: invalidate });

  const handleClick = (n: NotificationRow) => {
    setOpen(false);
    if (!n.isRead) readMutation.mutate(n.id);
    if (n.link) navigate(n.link);
  };

  const unread = data?.unread ?? 0;

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label="การแจ้งเตือน"
        aria-haspopup="menu"
        aria-expanded={open}
        className="relative grid size-9 place-items-center rounded-sm border border-hairline/15 bg-surface/60 text-ink-muted hover:border-hairline/30 hover:text-brand-500"
      >
        <Bell className="size-[18px]" aria-hidden />
        {unread > 0 && (
          <span className="absolute -right-1 -top-1 grid size-4 place-items-center rounded-full bg-danger text-[10px] font-bold text-white">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {open && (
        <>
          <button className="fixed inset-0 z-10 cursor-default" aria-hidden tabIndex={-1} onClick={() => setOpen(false)} />
          <div
            role="menu"
            className="absolute right-0 top-full z-20 mt-2 w-80 overflow-hidden rounded-sm border border-hairline/15 bg-surface shadow-float"
          >
            <div className="flex items-center justify-between border-b border-hairline/10 px-3.5 py-2.5">
              <p className="text-sm font-semibold text-ink">การแจ้งเตือน</p>
              {unread > 0 && (
                <button
                  onClick={() => readAllMutation.mutate()}
                  className="flex items-center gap-1 text-xs text-brand-500 hover:underline"
                >
                  <CheckCheck className="size-3.5" aria-hidden />
                  อ่านทั้งหมด
                </button>
              )}
            </div>
            <div className="max-h-80 overflow-y-auto">
              {isLoading && (
                <div className="py-6">
                  <Spinner />
                </div>
              )}
              {!isLoading && (data?.items.length ?? 0) === 0 && (
                <p className="px-3.5 py-6 text-center text-sm text-ink-subtle">ไม่มีการแจ้งเตือน</p>
              )}
              {data?.items.map((n) => (
                <button
                  key={n.id}
                  role="menuitem"
                  onClick={() => handleClick(n)}
                  className={`block w-full border-b border-hairline/10 px-3.5 py-2.5 text-left text-sm last:border-0 hover:bg-brand-500/[0.06] ${
                    n.isRead ? 'text-ink-muted' : 'text-ink'
                  }`}
                >
                  <p className={n.isRead ? 'font-normal' : 'font-semibold'}>{n.title}</p>
                  {n.message && <p className="mt-0.5 truncate text-xs text-ink-subtle">{n.message}</p>}
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
