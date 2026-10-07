import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { InvoiceStatus } from '@exyconn/shell/graphql/generated';
import { InvoiceForm } from '../../../../../../src/pages/finance/forms/invoice';
import { invoiceRow } from '../../../../fixtures';
import { field, localIso, renderForm, typeDate } from '../../../../form-helpers';
import { gql } from './invoice-gql';

vi.mock('@exyconn/shell/graphql/generated', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@exyconn/shell/graphql/generated')>()),
  ...(await import('./invoice-gql')).invoiceHooks,
}));

const handlers = () => ({ onDone: vi.fn(), onCancel: vi.fn() });

async function statusOptions(): Promise<string[]> {
  await userEvent.click(screen.getByRole('combobox', { name: /Status/ }));
  return within(screen.getByRole('listbox'))
    .getAllByRole('option')
    .map((option) => option.textContent ?? '');
}

describe('InvoiceForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    gql.create.mockResolvedValue({ data: { createInvoice: { id: 'invoice-9' } } });
    gql.update.mockResolvedValue({ data: { updateInvoice: { id: 'invoice-1' } } });
  });

  it('requires the number, client, currency and both dates', async () => {
    const { onDone, onCancel } = handlers();
    renderForm(<InvoiceForm initial={null} onDone={onDone} onCancel={onCancel} />);

    await userEvent.click(screen.getByRole('button', { name: 'Create' }));

    expect(await screen.findByText('Invoice number is required')).toBeInTheDocument();
    expect(screen.getByText('Client is required')).toBeInTheDocument();
    expect(screen.getByText('Currency is required')).toBeInTheDocument();
    expect(screen.getByText('Issued date is required')).toBeInTheDocument();
    expect(screen.getByText('Due date is required')).toBeInTheDocument();
    expect(gql.create).not.toHaveBeenCalled();
  });

  it('creates a draft invoice in the company currency for the client picked', async () => {
    const user = userEvent.setup();
    const { onDone, onCancel } = handlers();
    renderForm(<InvoiceForm initial={null} onDone={onDone} onCancel={onCancel} />, {
      inRupees: true,
    });

    await user.type(screen.getByLabelText('Invoice number'), 'INV-100');
    await user.type(screen.getByRole('combobox', { name: 'Client' }), 'Nimbus');
    await user.click(await screen.findByRole('option', { name: 'Nimbus Ltd · Nimbus' }));
    typeDate('issuedDate', '08/01/2026');
    typeDate('dueDate', '08/15/2026');
    await user.click(screen.getByRole('button', { name: 'Create' }));

    await waitFor(() => expect(onDone).toHaveBeenCalledTimes(1));
    expect(gql.create).toHaveBeenCalledWith({
      variables: {
        input: {
          number: 'INV-100',
          clientId: 'client-1',
          lines: [],
          amount: 0,
          currency: 'INR',
          status: InvoiceStatus.Draft,
          issuedDate: localIso(2026, 7, 1),
          dueDate: localIso(2026, 7, 15),
          placeOfSupplyStateCode: '',
        },
      },
    });
    expect(await screen.findByText('Invoice created')).toBeInTheDocument();
  });

  it('updates an invoice with its own figures, dropping the derived line amounts', async () => {
    const { onDone, onCancel } = handlers();
    const row = invoiceRow({
      lines: [
        {
          description: 'Design',
          quantity: 2,
          rate: 400,
          taxPercent: 18,
          hsnSac: '9983',
          amount: 944,
        },
      ],
    });
    renderForm(<InvoiceForm initial={row} onDone={onDone} onCancel={onCancel} />);

    await userEvent.click(screen.getByRole('button', { name: 'Update' }));

    await waitFor(() => expect(onDone).toHaveBeenCalledTimes(1));
    expect(gql.update).toHaveBeenCalledWith({
      variables: {
        id: 'invoice-1',
        input: {
          number: 'INV-001',
          clientId: 'client-1',
          lines: [
            { description: 'Design', quantity: 2, rate: 400, taxPercent: 18, hsnSac: '9983' },
          ],
          amount: 1000,
          currency: 'INR',
          status: InvoiceStatus.Sent,
          issuedDate: '2026-08-01',
          dueDate: '2026-08-15',
          placeOfSupplyStateCode: '27',
        },
      },
    });
    expect(await screen.findByText('Invoice updated')).toBeInTheDocument();
  });

  it('keeps the form open and says why when the save fails', async () => {
    gql.update.mockRejectedValueOnce(new Error('Invoice number already used'));
    const { onDone, onCancel } = handlers();
    renderForm(<InvoiceForm initial={invoiceRow()} onDone={onDone} onCancel={onCancel} />);

    await userEvent.click(screen.getByRole('button', { name: 'Update' }));

    expect(await screen.findByText('Invoice number already used')).toBeInTheDocument();
    expect(onDone).not.toHaveBeenCalled();
  });

  it('offers only draft and sent on a new invoice', async () => {
    renderForm(<InvoiceForm initial={null} {...handlers()} />);

    expect(await statusOptions()).toEqual(['Draft', 'Sent']);
  });

  it('keeps an overdue invoice overdue when it is opened to edit', async () => {
    renderForm(
      <InvoiceForm initial={invoiceRow({ status: InvoiceStatus.Overdue })} {...handlers()} />,
    );

    expect(await statusOptions()).toEqual(['Draft', 'Sent', 'Overdue']);
  });

  it('switches to the currency a newly picked client is invoiced in', async () => {
    const user = userEvent.setup();
    renderForm(<InvoiceForm initial={invoiceRow()} {...handlers()} />);
    expect(field('currency')).toHaveValue('Indian Rupee (INR)');

    await user.clear(screen.getByRole('combobox', { name: 'Client' }));
    await user.type(screen.getByRole('combobox', { name: 'Client' }), 'Glob');
    await user.click(await screen.findByRole('option', { name: 'Globex · Globex Corp' }));

    expect(field('currency')).toHaveValue('US Dollar (USD)');
  });

  it('leaves the currency alone for a client with none on file', async () => {
    const user = userEvent.setup();
    renderForm(<InvoiceForm initial={invoiceRow()} {...handlers()} />);

    await user.clear(screen.getByRole('combobox', { name: 'Client' }));
    await user.type(screen.getByRole('combobox', { name: 'Client' }), 'Init');
    await user.click(await screen.findByRole('option', { name: 'Initech · Initech LLC' }));

    expect(field('clientId')).toHaveValue('Initech · Initech LLC');
    expect(field('currency')).toHaveValue('Indian Rupee (INR)');
  });

  it('still opens with no client list loaded', () => {
    gql.clients.mockReturnValueOnce({ data: undefined } as never);
    renderForm(<InvoiceForm initial={null} {...handlers()} />);

    expect(screen.getByRole('combobox', { name: 'Client' })).toHaveValue('');
  });

  it('hands control back on cancel', async () => {
    const { onDone, onCancel } = handlers();
    renderForm(<InvoiceForm initial={null} onDone={onDone} onCancel={onCancel} />);

    await userEvent.click(screen.getByRole('button', { name: 'Cancel' }));

    expect(onCancel).toHaveBeenCalledTimes(1);
  });
});
