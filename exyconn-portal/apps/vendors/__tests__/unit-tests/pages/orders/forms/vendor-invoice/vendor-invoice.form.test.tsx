import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { VendorInvoiceForm } from '../../../../../../src/pages/orders/forms/vendor-invoice';
import { renderWithProviders } from '../../../../test-utils';

const gql = vi.hoisted(() => ({ submit: vi.fn(), upload: vi.fn() }));

vi.mock('@exyconn/shell/graphql/generated', async (importOriginal) => ({
  ...(await importOriginal<Record<string, unknown>>()),
  useVendorSubmitInvoiceMutation: () => [gql.submit],
  useVendorUploadInvoiceFileMutation: () => [gql.upload],
}));

const ORDER = { id: 'po-1', number: 'PO-0001', total: 1250, currency: 'USD' };
const PDF_URL = 'https://cdn.test/vendor-invoices/inv-77.pdf';

/** Local midnight as the ISO string a date picker stores. */
const localIso = (year: number, monthIndex: number, day: number) =>
  new Date(year, monthIndex, day).toISOString();

function field(name: string): HTMLInputElement {
  const input = document.querySelector<HTMLInputElement>(`[name="${name}"]`);
  if (!input) throw new Error(`No field named ${name}`);
  return input;
}

/** Types a whole date into a MUI X date picker the way the shell's picker tests do. */
const typeDate = (name: string, value: string) =>
  fireEvent.change(field(name), { target: { value } });

function renderForm() {
  const onDone = vi.fn();
  const onCancel = vi.fn();
  renderWithProviders(<VendorInvoiceForm order={ORDER} onDone={onDone} onCancel={onCancel} />);
  return { onDone, onCancel, user: userEvent.setup() };
}

const pdf = () => new File(['%PDF-1.7'], 'inv-77.pdf', { type: 'application/pdf' });

async function attach(user: ReturnType<typeof userEvent.setup>) {
  await user.upload(screen.getByTestId('attachment-input'), pdf());
  expect(await screen.findByText('inv-77.pdf')).toBeInTheDocument();
}

async function fillValid(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByLabelText(/^Invoice number\s*\*?$/), 'INV-77');
  typeDate('invoiceDate', '10/02/2026');
  typeDate('dueDate', '11/01/2026');
  await attach(user);
}

const send = (user: ReturnType<typeof userEvent.setup>) =>
  user.click(screen.getByRole('button', { name: 'Send invoice' }));

describe('VendorInvoiceForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    gql.upload.mockResolvedValue({ data: { vendorUploadInvoiceFile: PDF_URL } });
    gql.submit.mockResolvedValue({ data: { vendorSubmitInvoice: { id: 'vi-1' } } });
  });

  it("starts at the order's total, labelled in the order's currency", () => {
    renderForm();
    expect(screen.getByLabelText(/^Amount \(USD\)\s*\*?$/)).toHaveValue(1250);
  });

  it('requires the number, both dates and the document before sending', async () => {
    const { user } = renderForm();
    await send(user);

    expect(await screen.findByText('Invoice number is required')).toBeInTheDocument();
    expect(screen.getByText('Invoice date is required')).toBeInTheDocument();
    expect(screen.getByText('Due date is required')).toBeInTheDocument();
    expect(screen.getByRole('alert')).toHaveTextContent(
      'Attach the invoice document — one PDF or image',
    );
    expect(gql.submit).not.toHaveBeenCalled();
  });

  it('refuses an amount of zero', async () => {
    const { user } = renderForm();
    await fillValid(user);
    fireEvent.change(screen.getByLabelText(/^Amount \(USD\)\s*\*?$/), { target: { value: '0' } });
    await send(user);

    expect(await screen.findByText('The amount must be more than zero')).toBeInTheDocument();
    expect(gql.submit).not.toHaveBeenCalled();
  });

  it('refuses a due date before the invoice date', async () => {
    const { user } = renderForm();
    await fillValid(user);
    typeDate('dueDate', '09/30/2026');
    await send(user);

    expect(
      await screen.findByText('The due date cannot be before the invoice date'),
    ).toBeInTheDocument();
    expect(gql.submit).not.toHaveBeenCalled();
  });

  it('uploads the document through the vendor upload and sends the invoice for review', async () => {
    const { user, onDone } = renderForm();
    await fillValid(user);
    await user.type(screen.getByLabelText(/^Notes\s*\*?$/), 'Net 30');
    await send(user);

    await waitFor(() => expect(onDone).toHaveBeenCalledTimes(1));
    expect(gql.upload).toHaveBeenCalledWith({
      variables: {
        file: expect.stringMatching(/^data:application\/pdf;base64,/),
        fileName: 'inv-77.pdf',
      },
    });
    expect(gql.submit).toHaveBeenCalledWith({
      variables: {
        input: {
          purchaseOrderId: 'po-1',
          invoiceNumber: 'INV-77',
          invoiceDate: localIso(2026, 9, 2),
          dueDate: localIso(2026, 10, 1),
          amount: 1250,
          notes: 'Net 30',
          fileUrl: PDF_URL,
          fileName: 'inv-77.pdf',
        },
      },
    });
    expect(await screen.findByText('Invoice INV-77 sent for review')).toBeInTheDocument();
  });

  it('says why the invoice could not be sent and keeps the form open', async () => {
    gql.submit.mockRejectedValueOnce(new Error('Invoice INV-77 has already been sent.'));
    const { user, onDone } = renderForm();
    await fillValid(user);
    await send(user);

    expect(await screen.findByText('Invoice INV-77 has already been sent.')).toBeInTheDocument();
    expect(onDone).not.toHaveBeenCalled();
  });

  it('reports an upload that came back without a URL, attaching nothing', async () => {
    gql.upload.mockResolvedValueOnce({ data: { vendorUploadInvoiceFile: '' } });
    const { user } = renderForm();
    await user.upload(screen.getByTestId('attachment-input'), pdf());

    expect(await screen.findByText('Upload returned no URL')).toBeInTheDocument();
    expect(screen.queryByText('inv-77.pdf')).not.toBeInTheDocument();
  });

  it('calls onCancel', async () => {
    const { user, onCancel } = renderForm();
    await user.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(onCancel).toHaveBeenCalledTimes(1);
  });
});
