import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { InvoiceStatus, PaymentMethod } from '@exyconn/shell/graphql/generated';
import { PaymentForm } from '../../../../../src/pages/payments/forms/payment';
import { invoiceRow } from '../../../fixtures';
import { renderForm } from '../../../form-helpers';

const gql = vi.hoisted(() => ({ invoices: vi.fn(), record: vi.fn() }));

vi.mock('@exyconn/shell/graphql/generated', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@exyconn/shell/graphql/generated')>()),
  useListInvoicesQuery: () => gql.invoices(),
  useRecordPaymentMutation: () => [gql.record],
}));

const INVOICES = [
  invoiceRow({ id: 'invoice-1', number: 'INV-001', status: InvoiceStatus.Sent, balanceDue: 750 }),
  invoiceRow({ id: 'invoice-2', number: 'INV-002', status: InvoiceStatus.Draft }),
  invoiceRow({ id: 'invoice-3', number: 'INV-003', status: InvoiceStatus.Paid, balanceDue: 0 }),
  invoiceRow({ id: 'invoice-4', number: 'INV-004', status: InvoiceStatus.PartiallyPaid }),
  invoiceRow({ id: 'invoice-5', number: 'INV-005', status: InvoiceStatus.Overdue, balanceDue: 90 }),
];

async function chooseInvoice(label: string) {
  await userEvent.click(screen.getByRole('combobox', { name: /Invoice/ }));
  await userEvent.click(within(screen.getByRole('listbox')).getByRole('option', { name: label }));
}

const typeAmount = (value: string) =>
  fireEvent.change(screen.getByLabelText('Amount'), { target: { value } });

describe('PaymentForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    gql.invoices.mockReturnValue({ data: { listInvoices: INVOICES } });
    gql.record.mockResolvedValue({
      data: { recordPayment: { id: 'payment-1', amount: 250, invoiceNumber: 'INV-001' } },
    });
  });

  it('offers only invoices that can still take money, with what each still owes', async () => {
    renderForm(<PaymentForm onDone={vi.fn()} onCancel={vi.fn()} />);

    await userEvent.click(screen.getByRole('combobox', { name: /Invoice/ }));

    expect(
      within(screen.getByRole('listbox'))
        .getAllByRole('option')
        .map((option) => option.textContent),
    ).toEqual(['INV-001 — INR 750 owing', 'INV-004 — INR 750 owing', 'INV-005 — INR 90 owing']);
  });

  it('says what the payment will leave owing before it is recorded', async () => {
    renderForm(<PaymentForm onDone={vi.fn()} onCancel={vi.fn()} />);
    expect(
      screen.getByText('Choose an invoice to see what it will leave owing.'),
    ).toBeInTheDocument();

    await chooseInvoice('INV-001 — INR 750 owing');
    typeAmount('250');
    expect(screen.getByText('INR 750 → INR 500 still owing.')).toBeInTheDocument();

    typeAmount('750');
    expect(screen.getByText('INV-001 would be settled in full.')).toBeInTheDocument();

    typeAmount('800');
    expect(screen.getByText('That is INR 50 more than is owed.')).toBeInTheDocument();

    typeAmount('');
    expect(screen.getByText('INR 750 → INR 750 still owing.')).toBeInTheDocument();
  });

  it('records a bank transfer against the invoice and names it', async () => {
    const onDone = vi.fn();
    renderForm(<PaymentForm onDone={onDone} onCancel={vi.fn()} />);

    await chooseInvoice('INV-001 — INR 750 owing');
    typeAmount('250');
    await userEvent.type(screen.getByLabelText('Reference'), 'UTR-77');
    await userEvent.click(screen.getByRole('button', { name: 'Record' }));

    await waitFor(() => expect(onDone).toHaveBeenCalledTimes(1));
    expect(gql.record).toHaveBeenCalledWith({
      variables: {
        input: {
          invoiceId: 'invoice-1',
          amount: 250,
          method: PaymentMethod.BankTransfer,
          reference: 'UTR-77',
          notes: '',
        },
      },
    });
    expect(await screen.findByText('Recorded against INV-001.')).toBeInTheDocument();
  });

  it('records a refund as a negative amount, in the method picked', async () => {
    gql.record.mockResolvedValue({ data: undefined });
    renderForm(<PaymentForm onDone={vi.fn()} onCancel={vi.fn()} />);

    await chooseInvoice('INV-005 — INR 90 owing');
    typeAmount('-40');
    await userEvent.click(screen.getByRole('combobox', { name: /Method/ }));
    await userEvent.click(within(screen.getByRole('listbox')).getByRole('option', { name: 'Upi' }));
    await userEvent.click(screen.getByRole('button', { name: 'Record' }));

    await waitFor(() => expect(gql.record).toHaveBeenCalledTimes(1));
    expect(gql.record.mock.calls[0][0].variables.input).toMatchObject({
      invoiceId: 'invoice-5',
      amount: -40,
      method: PaymentMethod.Upi,
    });
    expect(await screen.findByText('Recorded against the invoice.')).toBeInTheDocument();
  });

  it('needs an invoice and a non-zero amount', async () => {
    renderForm(<PaymentForm onDone={vi.fn()} onCancel={vi.fn()} />);

    await userEvent.click(screen.getByRole('button', { name: 'Record' }));

    expect(await screen.findByText('Choose an invoice')).toBeInTheDocument();
    expect(screen.getByText('A payment of zero records nothing')).toBeInTheDocument();
    expect(gql.record).not.toHaveBeenCalled();
  });

  it('says why a payment could not be recorded, or that it could not', async () => {
    const onDone = vi.fn();
    gql.record.mockRejectedValueOnce(new Error('Invoice is already paid'));
    renderForm(<PaymentForm onDone={onDone} onCancel={vi.fn()} />);
    await chooseInvoice('INV-001 — INR 750 owing');
    typeAmount('100');

    await userEvent.click(screen.getByRole('button', { name: 'Record' }));
    expect(await screen.findByText('Invoice is already paid')).toBeInTheDocument();

    gql.record.mockRejectedValueOnce('offline');
    await userEvent.click(screen.getByRole('button', { name: 'Record' }));
    expect(await screen.findByText('Could not record the payment')).toBeInTheDocument();
    expect(onDone).not.toHaveBeenCalled();
  });

  it('offers no invoices until the list loads', async () => {
    gql.invoices.mockReturnValue({ data: undefined });
    renderForm(<PaymentForm onDone={vi.fn()} onCancel={vi.fn()} />);

    await userEvent.click(screen.getByRole('combobox', { name: /Invoice/ }));

    expect(screen.queryAllByRole('option')).toHaveLength(0);
  });
});
