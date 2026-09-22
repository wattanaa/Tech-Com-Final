import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Copy, Eye, EyeOff, Pencil, Trash2 } from 'lucide-react';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { GlassCard } from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { EmptyState, ErrorState, Spinner } from '@/components/ui/feedback';
import { Modal } from '@/components/admin/Modal';
import { ResourceForm } from '@/components/admin/resource/ResourceForm';
import { SortableList, DragHandle } from '@/components/admin/SortableList';
import { useToast } from '@/components/admin/Toast';
import { useConfirm } from '@/components/admin/ConfirmDialog';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { useResourceAdmin } from '@/hooks/admin/useResourceAdmin';
import { ApiClientError } from '@/api/client';
import {
  duplicateHomepageSection,
  listHomepageSections,
  removeHomepageSection,
  reorderHomepageSections,
  updateHomepageSection,
  type HomepageSectionAdmin,
  type UpdateSectionInput,
} from '@/api/admin/homepage';
import {
  SECTION_TYPE_LABEL,
  buildSectionUpdatePayload,
  getSectionFormFields,
  getSectionFormSchema,
  sectionToFormDefaults,
} from '@/config/homepageSections';
import type { AdminCategory } from '@/types/adminContent';

const QUERY_KEY = ['admin', 'homepage', 'sections'] as const;

export function HomepageBuilderPage() {
  useDocumentTitle('จัดหน้าแรก');
  const toast = useToast();
  const confirm = useConfirm();
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState<HomepageSectionAdmin | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const { data, isLoading, isError, refetch } = useQuery({ queryKey: QUERY_KEY, queryFn: listHomepageSections });
  const [localOrder, setLocalOrder] = useState<HomepageSectionAdmin[]>([]);
  useEffect(() => {
    if (data) setLocalOrder([...data].sort((a, b) => a.order - b.order));
  }, [data]);

  const categoriesAdmin = useResourceAdmin<AdminCategory, never>('categories');
  const categoriesQuery = categoriesAdmin.useList({ limit: 100, type: 'NEWS' });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: QUERY_KEY });

  const updateMutation = useMutation({
    mutationFn: ({ id, data: d }: { id: string; data: UpdateSectionInput }) => updateHomepageSection(id, d),
    onSuccess: invalidate,
  });
  const duplicateMutation = useMutation({ mutationFn: duplicateHomepageSection, onSuccess: invalidate });
  const removeMutation = useMutation({ mutationFn: removeHomepageSection, onSuccess: invalidate });
  const reorderMutation = useMutation({ mutationFn: reorderHomepageSections, onSuccess: invalidate });

  const formFields = useMemo(() => {
    if (!editing) return [];
    const fields = getSectionFormFields(editing.type);
    if (editing.type === 'NEWS') {
      const categoryOptions = (categoriesQuery.data?.items ?? []).map((c) => ({ value: c.id, label: c.name }));
      return fields.map((f) => (f.name === 'categoryId' ? { ...f, options: categoryOptions } : f));
    }
    if (editing.type === 'HERO') {
      // config.backgroundMedia มาจาก backend (ดู withHeroBackgroundMedia ใน homepage.routes.ts)
      // resolve id → {url, mimeType} ให้แล้ว จึงโชว์ preview ได้ทันทีโดยไม่ต้อง fetch เพิ่ม
      const bgId = editing.config.backgroundImageId as string | undefined;
      const bgMedia = editing.config.backgroundMedia as { url: string; mimeType: string } | undefined;
      return fields.map((f) =>
        f.name === 'backgroundImageId' && bgId && bgMedia
          ? { ...f, initialPreview: { id: bgId, url: bgMedia.url, mimeType: bgMedia.mimeType } }
          : f,
      );
    }
    return fields;
  }, [editing, categoriesQuery.data]);

  const handleToggleVisible = async (section: HomepageSectionAdmin) => {
    try {
      await updateMutation.mutateAsync({ id: section.id, data: { isVisible: !section.isVisible } });
      toast.success(section.isVisible ? 'ซ่อน section แล้ว' : 'แสดง section แล้ว');
    } catch (err) {
      toast.error(err instanceof ApiClientError ? err.message : 'ทำรายการไม่สำเร็จ');
    }
  };

  const handleDuplicate = async (section: HomepageSectionAdmin) => {
    try {
      await duplicateMutation.mutateAsync(section.id);
      toast.success('ทำสำเนา section สำเร็จ — เริ่มต้นเป็นสถานะซ่อนไว้');
    } catch (err) {
      toast.error(err instanceof ApiClientError ? err.message : 'ทำสำเนาไม่สำเร็จ');
    }
  };

  const handleDelete = async (section: HomepageSectionAdmin) => {
    const ok = await confirm({
      title: `ลบ section "${section.title ?? SECTION_TYPE_LABEL[section.type]}" ?`,
      danger: true,
      confirmLabel: 'ลบ',
    });
    if (!ok) return;
    try {
      await removeMutation.mutateAsync(section.id);
      toast.success('ลบ section สำเร็จ');
    } catch (err) {
      toast.error(err instanceof ApiClientError ? err.message : 'ลบไม่สำเร็จ — section ชนิดนี้อาจเหลือชุดเดียว');
    }
  };

  const handleReorder = async (items: HomepageSectionAdmin[]) => {
    setLocalOrder(items);
    try {
      await reorderMutation.mutateAsync(items.map((it, index) => ({ id: it.id, order: index })));
    } catch (err) {
      toast.error(err instanceof ApiClientError ? err.message : 'จัดลำดับไม่สำเร็จ');
      if (data) setLocalOrder([...data].sort((a, b) => a.order - b.order));
    }
  };

  const handleSubmit = async (values: Record<string, unknown>) => {
    if (!editing) return;
    setFormError(null);
    try {
      await updateMutation.mutateAsync({ id: editing.id, data: buildSectionUpdatePayload(editing.type, values) });
      toast.success('บันทึกการแก้ไขสำเร็จ');
      setEditing(null);
    } catch (err) {
      setFormError(err instanceof ApiClientError ? err.message : 'บันทึกไม่สำเร็จ กรุณาลองใหม่อีกครั้ง');
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <SectionHeader title="จัดหน้าแรก" description="ลากเพื่อจัดลำดับ section, ซ่อน/แสดง, หรือแก้ไขค่าตั้งแต่ละส่วน" />

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
          <EmptyState message="ยังไม่มี section" />
        </GlassCard>
      )}

      {!isLoading && localOrder.length > 0 && (
        <SortableList
          items={localOrder}
          onReorder={handleReorder}
          renderItem={(section, handle) => (
            <GlassCard padding="sm" className="flex items-center gap-3">
              <DragHandle {...handle} />
              <div className="min-w-0 flex-1">
                <p className="flex items-center gap-2 truncate text-sm font-medium text-ink">
                  {section.title || SECTION_TYPE_LABEL[section.type]}
                  <Badge>{SECTION_TYPE_LABEL[section.type]}</Badge>
                  {!section.isVisible && <Badge color="#94a3b8">ซ่อนอยู่</Badge>}
                </p>
                {section.subtitle && <p className="truncate text-xs text-ink-subtle">{section.subtitle}</p>}
              </div>
              <Button
                variant="ghost"
                size="xs"
                onClick={() => handleToggleVisible(section)}
                aria-label={section.isVisible ? 'ซ่อน section' : 'แสดง section'}
              >
                {section.isVisible ? <Eye className="size-4" aria-hidden /> : <EyeOff className="size-4" aria-hidden />}
              </Button>
              <Button variant="ghost" size="xs" onClick={() => handleDuplicate(section)} aria-label="ทำสำเนา">
                <Copy className="size-4" aria-hidden />
              </Button>
              <Button variant="ghost" size="xs" onClick={() => setEditing(section)} aria-label="แก้ไข">
                <Pencil className="size-4" aria-hidden />
              </Button>
              <Button variant="ghost" size="xs" onClick={() => handleDelete(section)} aria-label="ลบ">
                <Trash2 className="size-4 text-danger" aria-hidden />
              </Button>
            </GlassCard>
          )}
        />
      )}

      <Modal
        open={editing !== null}
        onClose={() => {
          setEditing(null);
          setFormError(null);
        }}
        title={editing ? `แก้ไข ${SECTION_TYPE_LABEL[editing.type]}` : ''}
        size="lg"
      >
        {editing && (
          <ResourceForm
            fields={formFields}
            schema={getSectionFormSchema(editing.type)}
            defaultValues={sectionToFormDefaults(editing)}
            onSubmit={handleSubmit}
            onCancel={() => setEditing(null)}
            submitError={formError}
          />
        )}
      </Modal>
    </div>
  );
}
