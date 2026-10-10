import { describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import { BoardColumnCard, TaskCard } from '../../../../../src/pages/projects/board';
import { renderWithProviders } from '../../../test-utils';
import { taskRow } from '../../../fixtures';
import { DndWrapper } from './dnd-wrapper';

vi.mock('@dnd-kit/sortable', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@dnd-kit/sortable')>();
  return {
    ...actual,
    useSortable: (args: Parameters<typeof actual.useSortable>[0]) => ({
      ...actual.useSortable(args),
      isDragging: true,
    }),
  };
});

const ancestorOpacities = (el: HTMLElement): string[] => {
  const found: string[] = [];
  for (let node: HTMLElement | null = el; node; node = node.parentElement) {
    found.push(getComputedStyle(node).opacity);
  }
  return found;
};

describe('a card that is being dragged', () => {
  it('fades the ticket card while it is lifted', () => {
    renderWithProviders(
      <DndWrapper ids={['task-1']}>
        <TaskCard task={taskRow()} onOpen={vi.fn()} />
      </DndWrapper>,
    );

    const card = screen.getByRole('button', { name: /^EXY-1: Login fails/ });
    expect(ancestorOpacities(card)).toContain('0.4');
  });

  it('fades the column while it is lifted', () => {
    renderWithProviders(
      <DndWrapper ids={['col-1']}>
        <BoardColumnCard
          column={{ id: 'col-1', name: 'To do', isDone: false }}
          index={0}
          columnCount={1}
          tasks={[]}
          onMoveColumn={vi.fn()}
          onRename={vi.fn()}
          onDelete={vi.fn()}
          onAddTask={vi.fn()}
          onOpenTask={vi.fn()}
          onToggleDone={vi.fn()}
        />
      </DndWrapper>,
    );

    const name = screen.getByRole('button', { name: 'Rename column To do' });
    expect(ancestorOpacities(name)).toContain('0.5');
  });
});
