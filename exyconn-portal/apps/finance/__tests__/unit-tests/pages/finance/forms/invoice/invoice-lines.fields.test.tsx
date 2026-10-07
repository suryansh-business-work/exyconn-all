import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { formatMoney } from '@exyconn/shell/utils/money';
import { InvoiceForm } from '../../../../../../src/pages/finance/forms/invoice';
import { invoiceRow } from '../../../../fixtures';
import { field, renderForm } from '../../../../form-helpers';
import { gql } from './invoice-gql';

vi.mock('@exyconn/shell/graphql/generated', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@exyconn/shell/graphql/generated')>()),
  ...(await import('./invoice-gql')).invoiceHooks,
}));

const hasField = (name: string) => document.querySelector(`[name="${name}"]`) !== null;

async function retype(name: string, value: string) {
  await userEvent.clear(field(name));
  await userEvent.type(field(name), value);
}

describe('InvoiceLinesFields', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    gql.update.mockResolvedValue({ data: { updateInvoice: { id: 'invoice-1' } } });
  });

  it('takes a typed amount until the invoice has a line', async () => {
    renderForm(<InvoiceForm initial={invoiceRow()} onDone={vi.fn()} onCancel={vi.fn()} />);
    expect(hasField('amount')).toBe(true);
    expect(screen.getByText('Used when the invoice has no lines')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Add line' }));

    expect(hasField('amount')).toBe(false);
    expect(field('lines.0.quantity')).toHaveValue(1);
    expect(field('lines.0.rate')).toHaveValue(0);
  });

  it('totals the lines live, tax included, in the invoice currency', async () => {
    renderForm(<InvoiceForm initial={invoiceRow()} onDone={vi.fn()} onCancel={vi.fn()} />);
    await userEvent.click(screen.getByRole('button', { name: 'Add line' }));

    await retype('lines.0.rate', '1000');
    await retype('lines.0.taxPercent', '18');

    expect(screen.getByText(`Total ${formatMoney(1180, 'INR')}`)).toBeInTheDocument();
    expect(screen.getByText(formatMoney(1180, 'INR'))).toBeInTheDocument();
  });

  it('counts a cleared number as nothing rather than breaking the total', async () => {
    const row = invoiceRow({
      lines: [
        { description: 'Hosting', quantity: 2, rate: 300, taxPercent: 0, hsnSac: '', amount: 600 },
      ],
    });
    renderForm(<InvoiceForm initial={row} onDone={vi.fn()} onCancel={vi.fn()} />);
    expect(screen.getByText(`Total ${formatMoney(600, 'INR')}`)).toBeInTheDocument();

    await userEvent.clear(field('lines.0.quantity'));

    expect(screen.getByText(`Total ${formatMoney(0, 'INR')}`)).toBeInTheDocument();
  });

  it('removes a line and brings the typed amount back with the last one gone', async () => {
    renderForm(<InvoiceForm initial={invoiceRow()} onDone={vi.fn()} onCancel={vi.fn()} />);
    await userEvent.click(screen.getByRole('button', { name: 'Add line' }));
    await userEvent.click(screen.getByRole('button', { name: 'Add line' }));
    expect(screen.getAllByRole('button', { name: 'remove line' })).toHaveLength(2);

    await userEvent.click(screen.getAllByRole('button', { name: 'remove line' })[0]);
    expect(screen.getAllByRole('button', { name: 'remove line' })).toHaveLength(1);
    await userEvent.click(screen.getByRole('button', { name: 'remove line' }));

    expect(hasField('amount')).toBe(true);
  });

  it('requires every line to say what it bills, and rejects a tax over 100%', async () => {
    renderForm(<InvoiceForm initial={invoiceRow()} onDone={vi.fn()} onCancel={vi.fn()} />);
    await userEvent.click(screen.getByRole('button', { name: 'Add line' }));
    await retype('lines.0.taxPercent', '120');

    await userEvent.click(screen.getByRole('button', { name: 'Update' }));

    expect(await screen.findByText('Describe the line')).toBeInTheDocument();
    expect(screen.getByText('Must be ≤ 100')).toBeInTheDocument();
    expect(gql.update).not.toHaveBeenCalled();
  });

  it('saves the lines as numbers, with the HSN/SAC code', async () => {
    const onDone = vi.fn();
    renderForm(<InvoiceForm initial={invoiceRow()} onDone={onDone} onCancel={vi.fn()} />);
    await userEvent.click(screen.getByRole('button', { name: 'Add line' }));
    await userEvent.type(field('lines.0.description'), 'Audit');
    await userEvent.type(field('lines.0.hsnSac'), '998222');
    await retype('lines.0.rate', '250');

    await userEvent.click(screen.getByRole('button', { name: 'Update' }));

    await waitFor(() => expect(onDone).toHaveBeenCalledTimes(1));
    expect(gql.update.mock.calls[0][0].variables.input.lines).toEqual([
      { description: 'Audit', quantity: 1, rate: 250, taxPercent: 0, hsnSac: '998222' },
    ]);
  });
});
