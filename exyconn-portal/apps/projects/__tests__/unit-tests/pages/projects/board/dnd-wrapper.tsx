import type { ReactNode } from 'react';
import { DndContext } from '@dnd-kit/core';
import { SortableContext } from '@dnd-kit/sortable';

/** The drag context a board puts around its columns and cards. */
export function DndWrapper({ ids, children }: Readonly<{ ids: string[]; children: ReactNode }>) {
  return (
    <DndContext>
      <SortableContext items={ids}>{children}</SortableContext>
    </DndContext>
  );
}
