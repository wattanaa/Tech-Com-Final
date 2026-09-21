import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import { z } from 'zod';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { GlassCard } from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { EmptyState, ErrorState, Spinner } from '@/components/ui/feedback';
import { Modal } from '@/components/admin/Modal';
import { ResourceForm, type ResourceFormField } from '@/components/admin/resource/ResourceForm';
import { SortableList, DragHandle } from '@/components/admin/SortableList';
import { useToast } from '@/components/admin/Toast';
import { useConfirm } from '@/components/admin/ConfirmDialog';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { ApiClientError } from '@/api/client';
import {
  createNavigationItem,
  listNavigationAdmin,
  removeNavigationItem,
  reorderNavigation,
  updateNavigationItem,
  type NavigationInput,
  type NavigationItemAdmin,
} from '@/api/admin/navigation';

const navSchema = z.object({
  label: z.string().trim().min(1, 'กรุณากรอกชื่อเมนู').max(100),
  href: z.string().trim().min(1, 'กรุณากรอกลิงก์').max(300),
  icon: z.string().trim().max(50).optional().or(z.literal('')),
  target: z.enum(['_self', '_blank']),
  isVisible: z.boolean(),
  parentId: z.string().optional().or(z.literal('')),
});
type NavForm = z.infer<typeof navSchema>;

const QUERY_KEY = ['admin', 'navigation'] as const;

export function NavigationPage() {
  useDocumentTitle('เมนูนำทาง');
  const toast = useToast();
  const confirm = useConfirm();
  const queryClient = useQueryClient();
  const [location, setLocation] = useState<'HEADER' | 'FOOTER'>('HEADER');
  const [modalItem, setModalItem] = useState<NavigationItemAdmin | 'new' | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const { data, isLoading, isError, refetch } = useQuery({ queryKey: QUERY_KEY, queryFn: listNavigationAdmin });

  const [localOrder, setLocalOrder] = useState<NavigationItemAdmin[]>([]);
  const topItems = useMemo(
    () => (data ?? []).filter((i) => i.location === location).sort((a, b) => a.order - b.order),
    [data, location],
  );
  useEffect(() => setLocalOrder(topItems), [topItems]);

  const invalidate = () => queryClient.invalidateQueries({ queryKey: QUERY_KEY });

  const createMutation = useMutation({ mutationFn: createNavigationItem, onSuccess: invalidate });
  const updateMutation = useMutation({
    mutationFn: ({ id, data: d }: { id: string; data: Partial<NavigationInput> }) => updateNavigationItem(id, d),
    onSuccess: invalidate,
  });
  const removeMutation = useMutation({
    mutationFn: ({ id, force }: { id: string; force?: boolean }) => removeNavigationItem(id, force),
    onSuccess: invalidate,
  });
  const reorderMutation = useMutation({ mutationFn: reorderNavigation, onSuccess: invalidate });

  const closeModal = () => {
    setModalItem(null);
    setFormError(null);
  };

  const formFields: ResourceFormField[] = [
    { name: 'label', label: 'ชื่อเมนู', type: 'text' },
    { name: 'href', label: 'ลิงก์ (URL)', type: 'text', placeholder: '/about หรือ https://...' },
    {
      name: 'target',
      label: 'เปิดลิงก์',
      type: 'select',
      options: [
        { value: '_self', label: 'หน้าเดิม' },
        { value: '_blank', label: 'แท็บใหม่' },
      ],
    },
    {
      name: 'parentId',
      label: 'เมนูหลัก (ถ้าต้องการเป็นเมนูย่อย)',
      type: 'select',
      options: topItems
        .filter((i) => modalItem === 'new' || i.id !== (modalItem as NavigationItemAdmin)?.id)
        .map((i) => ({ value: i.id, label: i.label })),
    },
    { name: 'isVisible', label: 'แสดงเมนูนี้', type: 'checkbox' },
  ];

  const handleSubmit = async (values: NavForm) => {
    setFormError(null);
    const payload: NavigationInput = {
      label: values.label,
      href: values.href,
      icon: values.icon || undefined,
      target: values.target,
      isVisible: values.isVisible,
      parentId: values.parentId || undefined,
      location,
      order: modalItem === 'new' ? topItems.length : (modalItem as NavigationItemAdmin).order,
    };
    try {
      if (modalItem === 'new') {
        await createMutation.mutateAsync(payload);
        toast.success('เพิ่มเมนูสำเร็จ');
      } else if (modalItem) {
        await updateMutation.mutateAsync({ id: modalItem.id, data: payload });
        toast.success('บันทึกการแก้ไขสำเร็จ');
      }
      closeModal();
    } catch (err) {
      setFormError(err instanceof ApiClientError ? err.message : 'บันทึกไม่สำเร็จ กรุณาลองใหม่อีกครั้ง');
    }
  };

  const handleDelete = async (item: NavigationItemAdmin) => {
    const hasChildren = (item.children?.length ?? 0) > 0;
    const ok = await confirm({
      title: `ลบเมนู "${item.label}" ?`,
      message: hasChildren ? `เมนูนี้มีเมนูย่อย ${item.children!.length} รายการ จะถูกลบไปด้วย` : undefined,
      danger: true,
      confirmLabel: 'ลบ',
    });
    if (!ok) return;
    try {
      await removeMutation.mutateAsync({ id: item.id, force: hasChildren });
      toast.success('ลบเมนูสำเร็จ');
    } catch (err) {
      toast.error(err instanceof ApiClientError ? err.message : 'ลบไม่สำเร็จ');
    }
  };

  const handleReorder = async (items: NavigationItemAdmin[]) => {
    setLocalOrder(items);
    try {
      await reorderMutation.mutateAsync(items.map((it, index) => ({ id: it.id, order: index })));
    } catch (err) {
      toast.error(err instanceof ApiClientError ? err.message : 'จัดลำดับไม่สำเร็จ');
      setLocalOrder(topItems);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <SectionHeader
        title="เมนูนำทาง"
        description="จัดการเมนูส่วนหัวและท้ายเว็บไซต์ ลากเพื่อจัดลำดับ"
        action={
          <Button size="sm" leftIcon={<Plus className="size-4" aria-hidden />} onClick={() => setModalItem('new')}>
            เพิ่มเมนู
          </Button>
        }
      />

      <div className="flex gap-2">
        <Button size="sm" variant={location === 'HEADER' ? 'primary' : 'outline'} onClick={() => setLocation('HEADER')}>
          เมนูส่วนหัว
        </Button>
        <Button size="sm" variant={location === 'FOOTER' ? 'primary' : 'outline'} onClick={() => setLocation('FOOTER')}>
          เมนูท้ายเว็บไซต์
        </Button>
      </div>

      {isError && (
        <GlassCard padding="lg">
          <ErrorState onRetry={() => refetch()} />
        </GlassCard>
      )}
      {isLoading && (
        <GlassCard padding="lg">
          <Spinner />
        </GlassCard>
      )}
      {!isLoading && !isError && localOrder.length === 0 && (
        <GlassCard padding="lg">
          <EmptyState message="ยังไม่มีเมนูในตำแหน่งนี้" />
        </GlassCard>
      )}

      {!isLoading && localOrder.length > 0 && (
        <SortableList
          items={localOrder}
          onReorder={handleReorder}
          renderItem={(item, handle) => (
            <GlassCard padding="sm" className="flex flex-col gap-2">
              <div className="flex items-center gap-3">
                <DragHandle {...handle} />
                <div className="min-w-0 flex-1">
                  <p className="flex items-center gap-2 truncate text-sm font-medium text-ink">
                    {item.label}
                    {!item.isVisible && <Badge color="#94a3b8">ซ่อนอยู่</Badge>}
                  </p>
                  <p className="truncate text-xs text-ink-subtle">{item.href}</p>
                </div>
                <Button variant="ghost" size="xs" onClick={() => setModalItem(item)} aria-label={`แก้ไข ${item.label}`}>
                  <Pencil className="size-4" aria-hidden />
                </Button>
                <Button variant="ghost" size="xs" onClick={() => handleDelete(item)} aria-label={`ลบ ${item.label}`}>
                  <Trash2 className="size-4 text-danger" aria-hidden />
                </Button>
              </div>
              {item.children && item.children.length > 0 && (
                <div className="ml-9 flex flex-col gap-1.5 border-l border-hairline/15 pl-3">
                  {item.children.map((child) => (
                    <div key={child.id} className="flex items-center gap-2 text-sm">
                      <span className="min-w-0 flex-1 truncate text-ink-muted">
                        {child.label}
                        {!child.isVisible && (
                          <span className="ml-1.5">
                            <Badge color="#94a3b8">ซ่อนอยู่</Badge>
                          </span>
                        )}
                      </span>
                      <Button
                        variant="ghost"
                        size="xs"
                        onClick={() => setModalItem(child)}
                        aria-label={`แก้ไข ${child.label}`}
                      >
                        <Pencil className="size-3.5" aria-hidden />
                      </Button>
                      <Button variant="ghost" size="xs" onClick={() => handleDelete(child)} aria-label={`ลบ ${child.label}`}>
                        <Trash2 className="size-3.5 text-danger" aria-hidden />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </GlassCard>
          )}
        />
      )}

      <Modal open={modalItem !== null} onClose={closeModal} title={modalItem === 'new' ? 'เพิ่มเมนู' : 'แก้ไขเมนู'}>
        <ResourceForm
          fields={formFields}
          schema={navSchema}
          defaultValues={{
            label: modalItem !== 'new' ? (modalItem?.label ?? '') : '',
            href: modalItem !== 'new' ? (modalItem?.href ?? '') : '',
            icon: modalItem !== 'new' ? (modalItem?.icon ?? '') : '',
            target: modalItem !== 'new' ? (modalItem?.target ?? '_self') : '_self',
            isVisible: modalItem !== 'new' ? (modalItem?.isVisible ?? true) : true,
            parentId: modalItem !== 'new' ? (modalItem?.parentId ?? '') : '',
          }}
          onSubmit={handleSubmit}
          onCancel={closeModal}
          submitError={formError}
        />
      </Modal>
    </div>
  );
}
