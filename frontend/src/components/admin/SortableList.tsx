import type { ReactNode } from 'react';
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical } from 'lucide-react';

export interface DragHandleProps {
  attributes: ReturnType<typeof useSortable>['attributes'];
  listeners: ReturnType<typeof useSortable>['listeners'];
}

/** ไอคอนจับลาก — วาง {...handle.attributes} {...handle.listeners} ไว้บน element นี้เสมอ */
export function DragHandle({ attributes, listeners }: DragHandleProps) {
  return (
    <button
      type="button"
      {...attributes}
      {...listeners}
      className="cursor-grab touch-none text-ink-subtle hover:text-ink active:cursor-grabbing"
      aria-label="ลากเพื่อจัดลำดับ"
    >
      <GripVertical className="size-4" aria-hidden />
    </button>
  );
}

/**
 * รายการลากจัดลำดับได้ — เก็บ state ลำดับไว้ที่ผู้เรียกเอง (controlled)
 * เมื่อลากเสร็จจะเรียก onReorder ด้วยอาร์เรย์ลำดับใหม่ทั้งชุด ผู้เรียกตัดสินใจเองว่าจะ
 * ยิง API บันทึกทันทีหรือรอปุ่มบันทึก
 */
export function SortableList<T extends { id: string }>({
  items,
  onReorder,
  renderItem,
}: {
  items: T[];
  onReorder: (items: T[]) => void;
  renderItem: (item: T, handle: DragHandleProps) => ReactNode;
}) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = items.findIndex((i) => i.id === active.id);
    const newIndex = items.findIndex((i) => i.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;
    onReorder(arrayMove(items, oldIndex, newIndex));
  };

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={items.map((i) => i.id)} strategy={verticalListSortingStrategy}>
        <div className="flex flex-col gap-2">
          {items.map((item) => (
            <SortableRow key={item.id} id={item.id}>
              {(handle) => renderItem(item, handle)}
            </SortableRow>
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}

function SortableRow({ id, children }: { id: string; children: (handle: DragHandleProps) => ReactNode }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };
  return (
    <div ref={setNodeRef} style={style}>
      {children({ attributes, listeners })}
    </div>
  );
}
