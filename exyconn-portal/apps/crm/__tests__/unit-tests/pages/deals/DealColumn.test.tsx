import type { ReactNode } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DndContext } from '@dnd-kit/core';
import { DealStage } from '@exyconn/shell/graphql/generated';
import { formatMoney } from '@exyconn/shell/utils/money';
import { DealColumn } from '../../../../src/pages/deals/DealColumn';
import { DealCard } from '../../../../src/pages/deals/DealCard';
import { renderWithProviders } from '../../test-utils';
import { dealRow } from '../../fixtures';

const ACCENT = '#3b82f6';

const DEALS = [
  dealRow({ id: 'deal-1', title: 'Acme rollout', value: 120000 }),
  dealRow({ id: 'deal-2', title: 'Globex pilot', companyName: '', value: 30000 }),
];

const inBoard = (children: ReactNode) => <DndContext>{children}</DndContext>;

function renderColumn(deals = DEALS, highlighted = false) {
  const onOpen = vi.fn();
  renderWithProviders(
    inBoard(
      <DealColumn
        stage={DealStage.Negotiation}
        accent={ACCENT}
        deals={deals}
        highlighted={highlighted}
        onOpen={onOpen}
      />,
    ),
  );
  return { onOpen };
}

/** The column itself: the parent of the stage heading row. */
const columnOf = (heading: string) =>
  screen.getByText(heading).parentElement?.parentElement as HTMLElement;

describe('DealCard', () => {
  it('shows the title, company, value and probability, and opens the deal on click', async () => {
    const onOpen = vi.fn();
    const deal = dealRow({ companyName: 'Initech', value: 75000, probability: 60 });
    renderWithProviders(<DealCard deal={deal} accent={ACCENT} onOpen={onOpen} />);

    const card = screen.getByRole('button', { name: /Acme rollout/ });
    expect(card).toHaveTextContent('Initech');
    expect(card).toHaveTextContent(formatMoney(75000));
    expect(card).toHaveTextContent('60%');

    await userEvent.click(card);
    expect(onOpen).toHaveBeenCalledWith(deal);
  });

  it('leaves the company line out when the deal has none', () => {
    const deal = dealRow({ companyName: '', value: 5000, probability: 20 });
    renderWithProviders(<DealCard deal={deal} accent={ACCENT} onOpen={vi.fn()} />);

    expect(screen.getByRole('button', { name: /Acme rollout/ }).textContent).toBe(
      `Acme rollout${formatMoney(5000)}20%`,
    );
  });
});

describe('DealColumn', () => {
  it('heads the column with the stage, the deal count and their total value', () => {
    renderColumn();

    expect(screen.getByText('Negotiation')).toBeInTheDocument();
    expect(screen.getByText(`2 · ${formatMoney(150000)}`)).toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: /^Drag / })).toHaveLength(2);
    expect(screen.queryByText('Nothing here.')).not.toBeInTheDocument();
  });

  it('says so when no deal sits in the stage', () => {
    renderColumn([]);

    expect(screen.getByText('Nothing here.')).toBeInTheDocument();
    expect(screen.getByText(`0 · ${formatMoney(0)}`)).toBeInTheDocument();
  });

  it('opens a deal from its card', async () => {
    const { onOpen } = renderColumn();

    await userEvent.click(screen.getByRole('button', { name: /^Globex pilot/ }));

    expect(onOpen).toHaveBeenCalledWith(DEALS[1]);
  });

  it('gives every card a grip that a keyboard can pick up', () => {
    renderColumn();

    const grip = screen.getByRole('button', { name: 'Drag Acme rollout' });
    expect(grip).toHaveAttribute('aria-roledescription', 'sortable');
    expect(grip).toHaveAttribute('tabindex', '0');
  });

  it('is only marked as the drop target while a card would land in it', () => {
    renderColumn(DEALS, true);
    expect(columnOf('Negotiation')).toHaveAttribute('data-drop-target', 'true');
  });

  it('is not marked as a drop target otherwise', () => {
    renderColumn();
    expect(columnOf('Negotiation')).not.toHaveAttribute('data-drop-target');
  });
});
