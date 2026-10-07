import { describe, expect, it, vi } from 'vitest';
import { fireEvent, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
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

function renderColumn(deals = DEALS) {
  const onOpen = vi.fn();
  const onDropDeal = vi.fn();
  renderWithProviders(
    <DealColumn
      stage={DealStage.Negotiation}
      accent={ACCENT}
      deals={deals}
      onOpen={onOpen}
      onDropDeal={onDropDeal}
    />,
  );
  return { onOpen, onDropDeal };
}

/** The column itself: the parent of the stage heading row. */
const columnOf = (heading: string) => screen.getByText(heading).parentElement?.parentElement;

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
    expect(screen.getAllByRole('button')).toHaveLength(2);
    expect(screen.queryByText('Nothing here.')).not.toBeInTheDocument();
  });

  it('says so when no deal sits in the stage', () => {
    renderColumn([]);

    expect(screen.getByText('Nothing here.')).toBeInTheDocument();
    expect(screen.getByText(`0 · ${formatMoney(0)}`)).toBeInTheDocument();
  });

  it('opens a deal from its card', async () => {
    const { onOpen } = renderColumn();

    await userEvent.click(screen.getByRole('button', { name: /Globex pilot/ }));

    expect(onOpen).toHaveBeenCalledWith(DEALS[1]);
  });

  it('puts the deal id on the drag when a card is picked up', () => {
    renderColumn();
    const setData = vi.fn();
    const draggable = screen.getByRole('button', { name: /Acme rollout/ }).parentElement;

    expect(draggable).toHaveAttribute('draggable', 'true');
    fireEvent.dragStart(draggable as HTMLElement, { dataTransfer: { setData } });

    expect(setData).toHaveBeenCalledWith('text/plain', 'deal-1');
  });

  it('accepts a drop and moves the dragged deal into this stage', () => {
    const { onDropDeal } = renderColumn();
    const column = columnOf('Negotiation') as HTMLElement;

    expect(fireEvent.dragOver(column)).toBe(false);
    fireEvent.drop(column, { dataTransfer: { getData: () => 'deal-9' } });

    expect(onDropDeal).toHaveBeenCalledWith('deal-9', DealStage.Negotiation);
  });

  it('ignores a drop that carries no deal', () => {
    const { onDropDeal } = renderColumn();

    fireEvent.drop(columnOf('Negotiation') as HTMLElement, {
      dataTransfer: { getData: () => '' },
    });

    expect(onDropDeal).not.toHaveBeenCalled();
  });
});
