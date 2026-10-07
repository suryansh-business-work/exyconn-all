import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SendInvoiceForm } from '../../../../../../src/pages/finance/forms/send-invoice';
import { invoiceRow } from '../../../../fixtures';
import { renderForm } from '../../../../form-helpers';

const gql = vi.hoisted(() => ({ send: vi.fn(), client: vi.fn(), clientOptions: [] as unknown[] }));

vi.mock('@exyconn/shell/graphql/generated', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@exyconn/shell/graphql/generated')>()),
  useSendInvoiceMutation: () => [gql.send],
  useGetClientQuery: (options: unknown) => {
    gql.clientOptions.push(options);
    return gql.client();
  },
}));

const onFile = (email: string) => ({
  data: { getClient: { id: 'client-1', name: 'Nimbus Ltd', email, company: 'Nimbus' } },
});

const recipient = () => screen.getByLabelText('Recipient email');

describe('SendInvoiceForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    gql.clientOptions.length = 0;
    gql.client.mockReturnValue(onFile('ap@nimbus.example'));
    gql.send.mockResolvedValue({ data: { sendInvoice: { id: 'invoice-1' } } });
  });

  it('says which invoice goes to which client, and starts with the email on file', async () => {
    renderForm(<SendInvoiceForm invoice={invoiceRow()} onDone={vi.fn()} onCancel={vi.fn()} />);

    expect(gql.clientOptions[0]).toEqual({ variables: { id: 'client-1' } });
    expect(screen.getByText('Sending invoice INV-001 to Nimbus Ltd as a PDF.')).toBeInTheDocument();
    await waitFor(() => expect(recipient()).toHaveValue('ap@nimbus.example'));
  });

  it('speaks of "the client" for an invoice with no client name stored', () => {
    renderForm(
      <SendInvoiceForm
        invoice={invoiceRow({ clientName: '' })}
        onDone={vi.fn()}
        onCancel={vi.fn()}
      />,
    );

    expect(screen.getByText('Sending invoice INV-001 to the client as a PDF.')).toBeInTheDocument();
  });

  it('sends to the address on file with no message, then reports it', async () => {
    const onDone = vi.fn();
    renderForm(<SendInvoiceForm invoice={invoiceRow()} onDone={onDone} onCancel={vi.fn()} />);
    await waitFor(() => expect(recipient()).toHaveValue('ap@nimbus.example'));

    await userEvent.click(screen.getByRole('button', { name: 'Send' }));

    await waitFor(() => expect(onDone).toHaveBeenCalledTimes(1));
    expect(gql.send).toHaveBeenCalledWith({
      variables: { id: 'invoice-1', email: 'ap@nimbus.example', message: null },
    });
    expect(
      await screen.findByText('Invoice INV-001 sent to ap@nimbus.example'),
    ).toBeInTheDocument();
  });

  it('sends to a different inbox with a note when one is typed', async () => {
    const onDone = vi.fn();
    gql.client.mockReturnValue({ data: undefined });
    renderForm(<SendInvoiceForm invoice={invoiceRow()} onDone={onDone} onCancel={vi.fn()} />);

    await userEvent.type(recipient(), 'billing@nimbus.example');
    await userEvent.type(screen.getByLabelText('Message (optional)'), 'Thanks for the work');
    await userEvent.click(screen.getByRole('button', { name: 'Send' }));

    await waitFor(() => expect(onDone).toHaveBeenCalledTimes(1));
    expect(gql.send).toHaveBeenCalledWith({
      variables: {
        id: 'invoice-1',
        email: 'billing@nimbus.example',
        message: 'Thanks for the work',
      },
    });
  });

  it('does not overwrite an address somebody already typed when the client loads', async () => {
    gql.client.mockReturnValue({ data: undefined });
    const { rerender } = renderForm(
      <SendInvoiceForm invoice={invoiceRow()} onDone={vi.fn()} onCancel={vi.fn()} />,
    );
    await userEvent.type(recipient(), 'mine@nimbus.example');

    gql.client.mockReturnValue(onFile('ap@nimbus.example'));
    rerender(
      <SendInvoiceForm
        invoice={invoiceRow({ number: 'INV-002' })}
        onDone={vi.fn()}
        onCancel={vi.fn()}
      />,
    );

    expect(await screen.findByText(/INV-002/)).toBeInTheDocument();
    expect(recipient()).toHaveValue('mine@nimbus.example');
  });

  it('refuses an address that is not an email', async () => {
    gql.client.mockReturnValue({ data: undefined });
    renderForm(<SendInvoiceForm invoice={invoiceRow()} onDone={vi.fn()} onCancel={vi.fn()} />);

    await userEvent.type(recipient(), 'not-an-email');
    await userEvent.click(screen.getByRole('button', { name: 'Send' }));

    expect(await screen.findByText('Enter a valid email')).toBeInTheDocument();
    expect(gql.send).not.toHaveBeenCalled();
  });

  it('says why a send failed, or that it failed when there is no reason', async () => {
    gql.send.mockRejectedValueOnce(new Error('Mail server unavailable'));
    renderForm(<SendInvoiceForm invoice={invoiceRow()} onDone={vi.fn()} onCancel={vi.fn()} />);
    await waitFor(() => expect(recipient()).toHaveValue('ap@nimbus.example'));

    await userEvent.click(screen.getByRole('button', { name: 'Send' }));
    expect(await screen.findByText('Mail server unavailable')).toBeInTheDocument();

    gql.send.mockRejectedValueOnce('offline');
    await userEvent.click(screen.getByRole('button', { name: 'Send' }));
    expect(await screen.findByText('Send failed')).toBeInTheDocument();
  });
});
