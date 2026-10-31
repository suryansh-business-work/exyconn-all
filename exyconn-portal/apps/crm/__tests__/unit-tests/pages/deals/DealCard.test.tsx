import { describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DealCard } from '../../../../src/pages/deals/DealCard';
import { renderWithProviders } from '../../test-utils';
import { dealRow } from '../../fixtures';

describe('DealCard', () => {
  it('shows only the typed probability before the deal is scored', () => {
    renderWithProviders(<DealCard deal={dealRow()} accent="#3b82f6" onOpen={vi.fn()} />);

    expect(screen.getByText('40%')).toBeInTheDocument();
    expect(screen.queryByText(/score/)).not.toBeInTheDocument();
  });

  it('shows the server score beside the probability once there is one, and opens the deal', async () => {
    const deal = dealRow({ score: 72 });
    const onOpen = vi.fn();
    renderWithProviders(<DealCard deal={deal} accent="#3b82f6" onOpen={onOpen} />);

    expect(screen.getByText('40% · score 72')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button'));
    expect(onOpen).toHaveBeenCalledWith(deal);
  });
});
