import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { InvoiceStatus } from '@exyconn/shell/graphql/generated';
import { RemindersPanel } from '../../../../src/pages/dashboard/RemindersPanel';
import { renderWithProviders } from '../../test-utils';

const gql = vi.hoisted(() => ({
  useClientHubPaymentOptionsQuery: vi.fn(),
  useClientHubPayInvoiceMutation: vi.fn(),
}));

vi.mock('@exyconn/shell/graphql/generated', async (importOriginal) => ({
  ...(await importOriginal<Record<string, unknown>>()),
  ...gql,
}));

const OVERDUE = {
  invoiceId: 'inv-1',
  number: 'INV-1',
  currency: 'USD',
  balance: 1200,
  dueDate: '2026-09-20T00:00:00.000Z',
  daysLate: 12,
  status: InvoiceStatus.Overdue,
};
const DUE = {
  invoiceId: 'inv-2',
  number: 'INV-2',
  currency: 'EUR',
  balance: 80,
  dueDate: '2026-10-14T00:00:00.000Z',
  daysLate: 0,
  status: InvoiceStatus.Sent,
};

describe('RemindersPanel', () => {
  beforeEach(() => {
    gql.useClientHubPaymentOptionsQuery.mockReturnValue({ data: undefined, loading: true });
    gql.useClientHubPayInvoiceMutation.mockReturnValue([vi.fn(), {}]);
  });

  it('thanks a client with nothing to pay', () => {
    renderWithProviders(<RemindersPanel reminders={[]} />);
    expect(screen.getByText('Payment reminders')).toBeInTheDocument();
    expect(screen.getByText('All paid up')).toBeInTheDocument();
    expect(screen.getByText('Nothing is waiting to be paid. Thank you!')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Pay now' })).not.toBeInTheDocument();
  });

  it('lists each unpaid invoice with its balance and how late it is', () => {
    renderWithProviders(<RemindersPanel reminders={[OVERDUE, DUE]} />);
    expect(screen.getByText('INV-1')).toBeInTheDocument();
    expect(screen.getByText('$1,200.00')).toBeInTheDocument();
    expect(screen.getByText('Overdue by 12 days').closest('.MuiChip-root')).toHaveClass(
      'MuiChip-colorError',
    );
    expect(screen.getByText('INV-2')).toBeInTheDocument();
    expect(screen.getByText('€80.00')).toBeInTheDocument();
    expect(screen.getByText('Due 14 Oct 2026').closest('.MuiChip-root')).toHaveClass(
      'MuiChip-outlined',
    );
    expect(screen.queryByText('All paid up')).not.toBeInTheDocument();
  });

  it('opens the payment for the invoice whose Pay button was pressed, and closes it again', async () => {
    const user = userEvent.setup();
    renderWithProviders(<RemindersPanel reminders={[OVERDUE, DUE]} />);
    await user.click(screen.getAllByRole('button', { name: 'Pay now' })[1]);
    expect(await screen.findByText('Pay invoice INV-2')).toBeInTheDocument();
    expect(screen.getByText('Amount due: €80.00')).toBeInTheDocument();
    expect(gql.useClientHubPaymentOptionsQuery).toHaveBeenLastCalledWith({ skip: false });

    await user.click(screen.getByRole('button', { name: 'Close' }));
    expect(screen.queryByText('Amount due: €80.00')).not.toBeInTheDocument();
  });
});
