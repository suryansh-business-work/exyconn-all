import { beforeEach, describe, expect, it, vi } from 'vitest';
import { act, screen } from '@testing-library/react';
import { useCreateInvoiceFromDeal } from '../../../../src/pages/deals/useCreateInvoiceFromDeal';
import { renderHookWithProviders } from '../../test-utils';

const mocks = vi.hoisted(() => ({ createInvoice: vi.fn(), navigate: vi.fn() }));

vi.mock('@exyconn/shell/graphql/generated', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@exyconn/shell/graphql/generated')>()),
  useCreateInvoiceFromDealMutation: () => [mocks.createInvoice],
}));

vi.mock('@exyconn/shell/hooks/useCrossAppNavigate', () => ({
  useCrossAppNavigate: () => mocks.navigate,
}));

const DEAL = { id: 'deal-1', title: 'Acme rollout' };

async function bill() {
  const { result } = renderHookWithProviders(() => useCreateInvoiceFromDeal());
  await act(async () => {
    await result.current(DEAL);
  });
}

describe('useCreateInvoiceFromDeal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('drafts the invoice for the deal and opens Finance invoices', async () => {
    mocks.createInvoice.mockResolvedValue({
      data: { createInvoiceFromDeal: { id: 'invoice-1', number: 'INV-0042' } },
    });

    await bill();

    expect(mocks.createInvoice).toHaveBeenCalledWith({ variables: { dealId: 'deal-1' } });
    expect(
      await screen.findByText('Invoice INV-0042 drafted for "Acme rollout"'),
    ).toBeInTheDocument();
    expect(mocks.navigate).toHaveBeenCalledWith('finance', '/finance/invoices');
  });

  it('still reports the draft when the server returns no invoice number', async () => {
    mocks.createInvoice.mockResolvedValue({ data: null });

    await bill();

    expect(await screen.findByText('Invoice drafted for "Acme rollout"')).toBeInTheDocument();
    expect(mocks.navigate).toHaveBeenCalledTimes(1);
  });

  it('shows the server reason and stays put when the deal cannot be billed', async () => {
    mocks.createInvoice.mockRejectedValue(new Error('This deal is already billed'));

    await bill();

    expect(await screen.findByText('This deal is already billed')).toBeInTheDocument();
    expect(mocks.navigate).not.toHaveBeenCalled();
  });

  it('falls back to a generic message for a failure that is not an Error', async () => {
    mocks.createInvoice.mockRejectedValue({ code: 'NETWORK' });

    await bill();

    expect(await screen.findByText('Could not create the invoice')).toBeInTheDocument();
    expect(mocks.navigate).not.toHaveBeenCalled();
  });
});
