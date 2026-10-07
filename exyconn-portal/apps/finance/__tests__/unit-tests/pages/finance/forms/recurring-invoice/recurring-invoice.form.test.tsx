import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { RecurrenceFrequency } from '@exyconn/shell/graphql/generated';
import { RecurringInvoiceForm } from '../../../../../../src/pages/finance/forms/recurring-invoice';
import { recurringRow } from '../../../../fixtures';
import { field, localIso, renderForm, typeDate } from '../../../../form-helpers';

const gql = vi.hoisted(() => ({ create: vi.fn(), update: vi.fn(), clients: vi.fn() }));

vi.mock('@exyconn/shell/graphql/generated', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@exyconn/shell/graphql/generated')>()),
  useCreateRecurringInvoiceMutation: () => [gql.create],
  useUpdateRecurringInvoiceMutation: () => [gql.update],
  useListClientsQuery: () => gql.clients(),
  useGstStatesQuery: () => ({ data: { gstStates: [{ code: '27', name: 'Maharashtra' }] } }),
}));

const CLIENTS = [{ id: 'client-2', name: 'Globex', currency: 'USD' }];

describe('RecurringInvoiceForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    gql.clients.mockReturnValue({ data: { listClients: CLIENTS } });
    gql.create.mockResolvedValue({ data: { createRecurringInvoice: { id: 'recurring-9' } } });
    gql.update.mockResolvedValue({ data: { updateRecurringInvoice: { id: 'recurring-1' } } });
  });

  it('requires a name, a client, a currency, a start date and at least one line', async () => {
    renderForm(<RecurringInvoiceForm initial={null} onDone={vi.fn()} onCancel={vi.fn()} />);

    await userEvent.click(screen.getByRole('button', { name: 'Create' }));

    expect(await screen.findByText('Name this retainer')).toBeInTheDocument();
    expect(screen.getByText('Client is required')).toBeInTheDocument();
    expect(screen.getByText('Currency is required')).toBeInTheDocument();
    expect(screen.getByText('Start date is required')).toBeInTheDocument();
    expect(screen.getByRole('alert')).toHaveTextContent('Add at least one line');
    expect(gql.create).not.toHaveBeenCalled();
  });

  it('creates a monthly retainer on 30-day terms that runs until it is paused', async () => {
    const user = userEvent.setup();
    const onDone = vi.fn();
    renderForm(<RecurringInvoiceForm initial={null} onDone={onDone} onCancel={vi.fn()} />, {
      inRupees: true,
    });

    await user.type(screen.getByLabelText('Name'), 'Globex hosting');
    await user.type(screen.getByRole('combobox', { name: 'Client' }), 'Glo');
    await user.click(await screen.findByRole('option', { name: 'Globex' }));
    await user.click(screen.getByRole('button', { name: 'Add line' }));
    await user.type(field('lines.0.description'), 'Hosting');
    typeDate('startDate', '10/01/2026');
    await user.click(screen.getByRole('button', { name: 'Create' }));

    await waitFor(() => expect(onDone).toHaveBeenCalledTimes(1));
    expect(gql.create).toHaveBeenCalledWith({
      variables: {
        input: {
          name: 'Globex hosting',
          clientId: 'client-2',
          lines: [{ description: 'Hosting', quantity: 1, rate: 0, taxPercent: 0, hsnSac: '' }],
          currency: 'INR',
          placeOfSupplyStateCode: '',
          frequency: RecurrenceFrequency.Monthly,
          startDate: localIso(2026, 9, 1),
          endDate: null,
          dueDays: 30,
          active: true,
        },
      },
    });
    expect(await screen.findByText('Recurring invoice created')).toBeInTheDocument();
  });

  it('updates a retainer, keeping its end date and a pause', async () => {
    const onDone = vi.fn();
    const row = recurringRow({ endDate: '2026-12-31', frequency: RecurrenceFrequency.Quarterly });
    renderForm(<RecurringInvoiceForm initial={row} onDone={onDone} onCancel={vi.fn()} />);

    await userEvent.click(field('active'));
    await userEvent.click(screen.getByRole('button', { name: 'Update' }));

    await waitFor(() => expect(onDone).toHaveBeenCalledTimes(1));
    expect(gql.update).toHaveBeenCalledWith({
      variables: {
        id: 'recurring-1',
        input: {
          name: 'Nimbus retainer',
          clientId: 'client-1',
          lines: [
            { description: 'Support', quantity: 1, rate: 50000, taxPercent: 0, hsnSac: '998313' },
          ],
          currency: 'INR',
          placeOfSupplyStateCode: '27',
          frequency: RecurrenceFrequency.Quarterly,
          startDate: '2026-01-01',
          endDate: '2026-12-31',
          dueDays: 15,
          active: false,
        },
      },
    });
  });

  it('refuses an end date before the start date', async () => {
    const row = recurringRow({ startDate: '2026-06-01', endDate: '2026-05-31' });
    renderForm(<RecurringInvoiceForm initial={row} onDone={vi.fn()} onCancel={vi.fn()} />);

    await userEvent.click(screen.getByRole('button', { name: 'Update' }));

    expect(
      await screen.findByText('The end date cannot be before the start date'),
    ).toBeInTheDocument();
    expect(gql.update).not.toHaveBeenCalled();
  });

  it('caps payment terms at a year, in whole days', async () => {
    renderForm(
      <RecurringInvoiceForm initial={recurringRow()} onDone={vi.fn()} onCancel={vi.fn()} />,
    );

    await userEvent.clear(screen.getByLabelText('Payment terms (days)'));
    await userEvent.type(screen.getByLabelText('Payment terms (days)'), '400');
    await userEvent.click(screen.getByRole('button', { name: 'Update' }));

    expect(await screen.findByText('Must be ≤ 365')).toBeInTheDocument();
  });

  it('says why a save failed and keeps the form open', async () => {
    gql.update.mockRejectedValueOnce(new Error('Client is archived'));
    const onDone = vi.fn();
    renderForm(
      <RecurringInvoiceForm initial={recurringRow()} onDone={onDone} onCancel={vi.fn()} />,
    );

    await userEvent.click(screen.getByRole('button', { name: 'Update' }));

    expect(await screen.findByText('Client is archived')).toBeInTheDocument();
    expect(onDone).not.toHaveBeenCalled();
  });

  it('opens with an empty client picker before the clients load', () => {
    gql.clients.mockReturnValue({ data: undefined });
    renderForm(<RecurringInvoiceForm initial={null} onDone={vi.fn()} onCancel={vi.fn()} />);

    expect(screen.getByRole('combobox', { name: 'Client' })).toHaveValue('');
    expect(
      screen.getByText('For this screen only — never printed on the invoice.'),
    ).toBeInTheDocument();
  });
});
