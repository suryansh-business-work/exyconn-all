import { describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import { DndContext } from '@dnd-kit/core';
import { SortableContext } from '@dnd-kit/sortable';
import { DealStage } from '@exyconn/shell/graphql/generated';
import { SortableDealCard } from '../../../../src/pages/deals/SortableDealCard';
import { renderWithProviders } from '../../test-utils';
import { dealRow } from '../../fixtures';

const sortable = vi.hoisted(() => ({ dragging: false }));

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

function renderCard(dragging: boolean) {
  sortable.dragging = dragging;
  const deal = dealRow({ id: 'deal-1', title: 'Acme rollout' });
  renderWithProviders(
    <DndContext>
      <SortableContext items={[deal.id]}>
        <SortableDealCard
          deal={deal}
          stage={DealStage.Proposal}
          accent="#3b82f6"
          onOpen={vi.fn()}
        />
      </SortableContext>
    </DndContext>,
  );
}

describe('SortableDealCard', () => {
  it('shows the card and its grip when it is not being carried', () => {
    renderCard(false);

    expect(screen.queryByTestId('deal-drop-placeholder')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^Acme rollout/ })).toBeVisible();
    expect(screen.getByRole('button', { name: 'Drag Acme rollout' })).toBeVisible();
  });

  it('turns its slot into an outlined, empty placeholder of the same size while carried', () => {
    renderCard(true);

    const placeholder = screen.getByTestId('deal-drop-placeholder');
    const content = placeholder.firstElementChild as HTMLElement;
    expect(getComputedStyle(placeholder).outline).toMatch(/^2px dashed /);
    // The card stays in the slot to hold its height, but nobody sees or hears it there.
    expect(content).toHaveAttribute('aria-hidden', 'true');
    expect(getComputedStyle(content).visibility).toBe('hidden');
    expect(screen.queryByRole('button', { name: /^Acme rollout/ })).not.toBeInTheDocument();
  });
});
