import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, screen, waitFor } from '@testing-library/react';
import {
  RejectVendorInvoiceForm,
  rejectVendorInvoiceSchema,
} from '../../../../../../src/pages/vendor-invoices/forms/reject-vendor-invoice';
import { renderWithProviders } from '../../../../test-utils';
import { vendorInvoiceRow } from '../../../../vendor-fixtures';
import { fillField, press } from '../../../../form-helpers';

const gql = vi.hoisted(() => ({ reject: vi.fn() }));

vi.mock('@exyconn/shell/graphql/generated', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@exyconn/shell/graphql/generated')>()),
  useRejectVendorInvoiceMutation: () => [gql.reject],
}));

function renderForm() {
  const onDone = vi.fn();
  const onCancel = vi.fn();
  renderWithProviders(
    <RejectVendorInvoiceForm invoice={vendorInvoiceRow()} onDone={onDone} onCancel={onCancel} />,
  );
  return { onDone, onCancel };
}

describe('rejectVendorInvoiceSchema', () => {
  it('trims the reason and caps it at 1000 characters', () => {
    expect(rejectVendorInvoiceSchema.parse({ reason: '  Wrong tax rate  ' })).toEqual({
      reason: 'Wrong tax rate',
    });
    expect(rejectVendorInvoiceSchema.safeParse({ reason: 'x'.repeat(1000) }).success).toBe(true);
    expect(rejectVendorInvoiceSchema.safeParse({ reason: 'x'.repeat(1001) }).success).toBe(false);
  });
});

describe('RejectVendorInvoiceForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    gql.reject.mockResolvedValue({ data: { rejectVendorInvoice: { id: 'vinv-1' } } });
  });

  it('needs a reason, and a blank one counts as none', async () => {
    renderForm();
    await fillField('Reason', '   ');

    await press('Reject invoice');

    expect(await screen.findByText('Say why the invoice is rejected')).toBeInTheDocument();
    expect(gql.reject).not.toHaveBeenCalled();
  });

  it('refuses a reason over 1000 characters', async () => {
    renderForm();
    fireEvent.change(screen.getByLabelText(/^Reason/), { target: { value: 'x'.repeat(1001) } });

    await press('Reject invoice');

    expect(await screen.findByText('Keep the reason under 1000 characters')).toBeInTheDocument();
    expect(gql.reject).not.toHaveBeenCalled();
  });

  it('sends the invoice back with the trimmed reason and says so', async () => {
    const { onDone } = renderForm();
    await fillField('Reason', '  Tax charged twice  ');

    await press('Reject invoice');

    await waitFor(() => expect(onDone).toHaveBeenCalledTimes(1));
    expect(gql.reject).toHaveBeenCalledWith({
      variables: { id: 'vinv-1', reason: 'Tax charged twice' },
    });
    expect(await screen.findByText('Invoice INV-42 sent back')).toBeInTheDocument();
  });

  it('shows the server refusal in the form and stays open', async () => {
    gql.reject.mockRejectedValueOnce(
      new Error('Only an invoice waiting for review can be rejected.'),
    );
    const { onDone } = renderForm();
    await fillField('Reason', 'Wrong order');

    await press('Reject invoice');

    expect(
      await screen.findByText('Only an invoice waiting for review can be rejected.'),
    ).toBeInTheDocument();
    expect(onDone).not.toHaveBeenCalled();
  });

  it('falls back to a plain message when the failure is not an Error', async () => {
    gql.reject.mockRejectedValueOnce('offline');
    renderForm();
    await fillField('Reason', 'Wrong order');

    await press('Reject invoice');

    expect(await screen.findByText('The invoice could not be rejected')).toBeInTheDocument();
  });

  it('cancels without sending anything', async () => {
    const { onCancel } = renderForm();

    await press('Cancel');

    expect(onCancel).toHaveBeenCalledTimes(1);
    expect(gql.reject).not.toHaveBeenCalled();
  });
});
