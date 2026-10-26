import { describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PayoutAccountDetails } from '@/components/payout';
import { renderWithProviders } from '../../test-utils';
import { bankAccount, upiAccount } from './payoutFixtures';

describe('PayoutAccountDetails', () => {
  it('shows the plain details and a masked sealed one, with a dash for what is empty', () => {
    renderWithProviders(<PayoutAccountDetails row={bankAccount()} reveal={vi.fn()} />);

    expect(screen.getByText('Bank transfer · IN · INR')).toBeInTheDocument();
    expect(screen.getByText('HDFC0001234')).toBeInTheDocument();
    expect(screen.getByText('•••• 6789')).toBeInTheDocument();
    expect(screen.getAllByText('—').length).toBeGreaterThan(0);
  });

  it('shows a dash for an account type that was never set', () => {
    renderWithProviders(
      <PayoutAccountDetails row={bankAccount({ accountType: null })} reveal={vi.fn()} />,
    );

    const label = screen.getByText('Account type');
    expect(label.nextElementSibling).toHaveTextContent('—');
  });

  it('offers no Show for a sealed detail that was never saved', () => {
    renderWithProviders(<PayoutAccountDetails row={upiAccount()} reveal={vi.fn()} />);

    expect(screen.getAllByRole('button', { name: /^Show/ })).toHaveLength(1);
  });

  it('says why a detail could not be shown', async () => {
    const reveal = vi.fn().mockRejectedValue(new Error('Locked'));
    renderWithProviders(<PayoutAccountDetails row={bankAccount()} reveal={reveal} />);

    await userEvent.setup().click(screen.getByRole('button', { name: 'Show Account number' }));

    expect(await screen.findByText('Locked')).toBeInTheDocument();
    expect(screen.getByText('•••• 6789')).toBeInTheDocument();
  });
});
