import { beforeEach, describe, expect, it, vi } from 'vitest';
import { act, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { appUrl } from '@exyconn/shell/config/apps';
import { useInvoiceFromTimeLog } from '../../../../src/pages/tracker/useInvoiceFromTimeLog';
import type { ProjectBillingRow } from '../../../../src/pages/tracker/tracker.billing';
import { renderHookWithProviders } from '../../test-utils';
import { projectRow } from './tracker.fixtures';

const gql = vi.hoisted(() => ({ create: vi.fn(), loading: false }));

vi.mock('@exyconn/shell/graphql/generated', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@exyconn/shell/graphql/generated')>()),
  useCreateInvoiceFromTimeLogMutation: () => [gql.create, { loading: gql.loading }],
}));

const range = { from: '2026-01-01T00:00:00.000Z', to: '2026-02-01T00:00:00.000Z' };
const money = { format: (value: number) => `$${value.toFixed(2)}` } as Intl.NumberFormat;
const toast = () => screen.findByRole('alert', { hidden: true });

/** Starts raising an invoice for `row` and answers the confirmation with `button`. */
async function raise(row: ProjectBillingRow, button: 'Create invoice' | 'Cancel') {
  const hook = renderHookWithProviders(() => useInvoiceFromTimeLog(range, money));
  let pending: Promise<void> = Promise.resolve();
  act(() => {
    pending = hook.result.current.raise(row);
  });
  const dialog = await screen.findByRole('dialog');
  const text = dialog.textContent ?? '';
  await userEvent.click(within(dialog).getByRole('button', { name: button }));
  await act(() => pending);
  return { hook, text };
}

describe('useInvoiceFromTimeLog', () => {
  beforeEach(() => {
    gql.loading = false;
    gql.create.mockReset().mockResolvedValue({
      data: {
        createInvoiceFromTimeLog: {
          id: 'inv-1',
          number: 'INV-0042',
          amount: 1200,
          currency: 'USD',
        },
      },
    });
  });

  it('names the client, amount, hours and project before raising anything', async () => {
    const { text } = await raise(projectRow(), 'Cancel');
    expect(text).toContain('Raise a draft invoice to Acme for $1200.00 — 30 h on Website rebuild?');
    expect(gql.create).not.toHaveBeenCalled();
  });

  it('says "the client" when the project has no client name', async () => {
    const { text } = await raise(projectRow({ clientName: '' }), 'Cancel');
    expect(text).toContain('Raise a draft invoice to the client for');
  });

  it('raises a draft for the period, links to it in Finance and says so', async () => {
    const { hook } = await raise(projectRow(), 'Create invoice');
    expect(gql.create).toHaveBeenCalledWith({
      variables: { projectId: 'p1', from: range.from, to: range.to },
    });
    expect(hook.result.current.raised).toEqual({
      number: 'INV-0042',
      url: appUrl('finance', '/finance/invoices'),
    });
    expect(await toast()).toHaveTextContent('Invoice INV-0042 created as a draft.');

    act(() => hook.result.current.dismiss());
    expect(hook.result.current.raised).toBeNull();
  });

  it('leaves nothing raised when the server returns no invoice', async () => {
    gql.create.mockResolvedValue({ data: null });
    const { hook } = await raise(projectRow(), 'Create invoice');
    expect(gql.create).toHaveBeenCalledTimes(1);
    expect(hook.result.current.raised).toBeNull();
    await waitFor(() => expect(screen.queryByRole('alert', { hidden: true })).toBeNull());
  });

  it('says why the invoice could not be created', async () => {
    gql.create.mockRejectedValue(new Error('Client has no billing address'));
    const { hook } = await raise(projectRow(), 'Create invoice');
    expect(await toast()).toHaveTextContent('Client has no billing address');
    expect(hook.result.current.raised).toBeNull();
  });

  it('falls back to a plain message when the failure carries none', async () => {
    gql.create.mockRejectedValue('offline');
    await raise(projectRow(), 'Create invoice');
    expect(await toast()).toHaveTextContent('The invoice could not be created.');
  });

  it('reports while an invoice is being raised', () => {
    gql.loading = true;
    const { result } = renderHookWithProviders(() => useInvoiceFromTimeLog(range, money));
    expect(result.current.raising).toBe(true);
    expect(result.current.raised).toBeNull();
  });
});
