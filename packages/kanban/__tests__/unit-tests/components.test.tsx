import type { ReactNode } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { DndContext } from '@dnd-kit/core';
import { SortableContext } from '@dnd-kit/sortable';
import { createTheme } from '@exyconn/ui';
import { SortableKanbanItem } from '../../src/SortableKanbanItem';
import { KanbanDragOverlay, overlayGrip } from '../../src/KanbanDragOverlay';
import { dropTargetRing } from '../../src/dropTargetRing';

const sortable = vi.hoisted(() => ({ dragging: false }));

// The real overlay only renders while a drag is under way; here it renders what it is given.
vi.mock('@dnd-kit/core', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@dnd-kit/core')>()),
  DragOverlay: ({ children }: { children: ReactNode }) => <>{children}</>,
}));

vi.mock('@dnd-kit/sortable', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@dnd-kit/sortable')>();
  return {
    ...actual,
    useSortable: (args: Parameters<typeof actual.useSortable>[0]) => ({
      ...actual.useSortable(args),
      isDragging: sortable.dragging,
    }),
  };
});

function renderItem(dragging: boolean) {
  sortable.dragging = dragging;
  render(
    <DndContext>
      <SortableContext items={['card-1']}>
        <SortableKanbanItem id="card-1" column="todo" dragLabel="Drag Acme">
          {(grip) => (
            <div>
              {grip}
              <button type="button">Acme</button>
            </div>
          )}
        </SortableKanbanItem>
      </SortableContext>
    </DndContext>,
  );
}

describe('SortableKanbanItem', () => {
  it('shows the card with the grip where the card put it', () => {
    renderItem(false);

    expect(screen.queryByTestId('kanban-drop-placeholder')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Acme' })).toBeVisible();
    expect(screen.getByRole('button', { name: 'Drag Acme' })).toBeVisible();
  });

  it('turns its slot into an outlined, empty placeholder of the same size while carried', () => {
    renderItem(true);

    const placeholder = screen.getByTestId('kanban-drop-placeholder');
    const content = placeholder.firstElementChild as HTMLElement;
    expect(getComputedStyle(placeholder).outline).toMatch(/^2px dashed /);
    expect(content).toHaveAttribute('aria-hidden', 'true');
    expect(getComputedStyle(content).visibility).toBe('hidden');
  });
});

describe('KanbanDragOverlay', () => {
  it('lifts the card in hand on a shadow, inert to assistive tech', () => {
    render(
      <DndContext>
        <KanbanDragOverlay>
          <span>Acme</span>
          {overlayGrip}
        </KanbanDragOverlay>
      </DndContext>,
    );

    const lifted = screen.getByTestId('kanban-drag-overlay');
    expect(lifted).toHaveAttribute('inert');
    expect(getComputedStyle(lifted).boxShadow).not.toBe('');
  });

  it('renders nothing while no card is carried', () => {
    render(
      <DndContext>
        <KanbanDragOverlay>{null}</KanbanDragOverlay>
      </DndContext>,
    );

    expect(screen.queryByTestId('kanban-drag-overlay')).not.toBeInTheDocument();
  });
});

describe('dropTargetRing', () => {
  const theme = createTheme();

  it('rings the column in the primary colour by default', () => {
    expect(dropTargetRing()(theme)).toEqual({
      boxShadow: `inset 0 0 0 2px ${theme.palette.primary.main}`,
      bgcolor: 'action.hover',
    });
  });

  it('rings the column in its own accent when it has one', () => {
    expect(dropTargetRing('#123456')(theme).boxShadow).toMatch(/^inset 0 0 0 2px #/);
  });
});
