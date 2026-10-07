import type { ReactNode } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, renderHook, screen } from '@testing-library/react';
import { NotificationProvider } from '@exyconn/shell/components/feedback/NotificationProvider';
import { ClientHubInvoicePdfDocument } from '@exyconn/shell/graphql/generated';
import { useInvoiceActions } from '../../../../src/pages/invoices/useInvoiceActions';

const gql = vi.hoisted(() => ({ useClientHubEmailInvoiceMutation: vi.fn() }));
const apollo = vi.hoisted(() => ({ query: vi.fn() }));
const file = vi.hoisted(() => ({ downloadBase64File: vi.fn() }));

vi.mock('@exyconn/shell/graphql/generated', async (importOriginal) => ({
  ...(await importOriginal<Record<string, unknown>>()),
  ...gql,
}));
vi.mock('@apollo/client/react', async (importOriginal) => ({
  ...(await importOriginal<Record<string, unknown>>()),
  useApolloClient: () => apollo,
}));
vi.mock('@exyconn/shell/utils/file', async (importOriginal) => ({
  ...(await importOriginal<Record<string, unknown>>()),
  ...file,
}));

const INVOICE = { id: 'inv-7', number: 'INV-7' };
const emailInvoice = vi.fn();

function Providers({ children }: Readonly<{ children: ReactNode }>) {
  return <NotificationProvider>{children}</NotificationProvider>;
}

function setup() {
  return renderHook(() => useInvoiceActions(), { wrapper: Providers }).result;
}

describe('useInvoiceActions', () => {
  beforeEach(() => gql.useClientHubEmailInvoiceMutation.mockReturnValue([emailInvoice, {}]));
  afterEach(() => vi.clearAllMocks());

  it('downloads the invoice PDF, always fresh from the server, named after the invoice', async () => {
    apollo.query.mockResolvedValue({ data: { clientHubInvoicePdf: 'JVBERi0xLjQ=' } });
    const result = setup();
    act(() => result.current.download(INVOICE));
    await act(() => apollo.query.mock.results[0].value);
    expect(apollo.query).toHaveBeenCalledWith({
      query: ClientHubInvoicePdfDocument,
      variables: { id: 'inv-7' },
      fetchPolicy: 'network-only',
    });
    expect(file.downloadBase64File).toHaveBeenCalledWith(
      'INV-7.pdf',
      'application/pdf',
      'JVBERi0xLjQ=',
    );
  });

  it('saves nothing when the server answers without a PDF', async () => {
    apollo.query.mockResolvedValue({ data: undefined });
    const result = setup();
    act(() => result.current.download(INVOICE));
    await act(() => apollo.query.mock.results[0].value);
    expect(file.downloadBase64File).not.toHaveBeenCalled();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it("tells the contact why a download failed, or that it did when there's no reason", async () => {
    apollo.query.mockRejectedValueOnce(new Error('The PDF is still being generated'));
    apollo.query.mockRejectedValueOnce('offline');
    const result = setup();
    act(() => result.current.download(INVOICE));
    expect(await screen.findByText('The PDF is still being generated')).toBeInTheDocument();
    act(() => result.current.download(INVOICE));
    expect(await screen.findByText('Could not download the invoice')).toBeInTheDocument();
    expect(file.downloadBase64File).not.toHaveBeenCalled();
  });

  it('emails the invoice to the contact and confirms it is on its way', async () => {
    emailInvoice.mockResolvedValue({ data: { clientHubEmailInvoice: true } });
    const result = setup();
    act(() => result.current.email(INVOICE));
    expect(
      await screen.findByText('Invoice INV-7 is on its way to your inbox'),
    ).toBeInTheDocument();
    expect(emailInvoice).toHaveBeenCalledWith({ variables: { id: 'inv-7' } });
  });

  it("tells the contact why the email failed, or that it did when there's no reason", async () => {
    emailInvoice.mockRejectedValueOnce(new Error('Mailbox unavailable'));
    emailInvoice.mockRejectedValueOnce({ status: 500 });
    const result = setup();
    act(() => result.current.email(INVOICE));
    expect(await screen.findByText('Mailbox unavailable')).toBeInTheDocument();
    act(() => result.current.email(INVOICE));
    expect(await screen.findByText('Could not email the invoice')).toBeInTheDocument();
  });
});
