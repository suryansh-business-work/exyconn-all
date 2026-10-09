import { beforeEach, describe, expect, it, vi } from 'vitest';
import { act, screen } from '@testing-library/react';
import { useInvoiceDownload } from '../../../../src/pages/finance/useInvoiceDownload';
import { renderHookWithProviders } from '../../test-utils';

const gql = vi.hoisted(() => ({ fetchPdf: vi.fn(), loading: false, options: null as unknown }));
const file = vi.hoisted(() => ({ downloadBase64File: vi.fn() }));

vi.mock('@exyconn/shell/graphql/generated', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@exyconn/shell/graphql/generated')>()),
  useInvoicePdfLazyQuery: (options: unknown) => {
    gql.options = options;
    return [gql.fetchPdf, { loading: gql.loading }];
  },
}));

vi.mock('@exyconn/shell/utils/file', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@exyconn/shell/utils/file')>()),
  ...file,
}));

async function download(id: string, number: string) {
  const { result } = renderHookWithProviders(() => useInvoiceDownload());
  await act(async () => {
    await result.current.download(id, number);
  });
  return result;
}

describe('useInvoiceDownload', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    gql.loading = false;
  });

  it('always asks the server for a freshly rendered PDF', () => {
    renderHookWithProviders(() => useInvoiceDownload());

    expect(gql.options).toEqual({ fetchPolicy: 'network-only' });
  });

  it('saves the rendered invoice as a PDF named after its number', async () => {
    gql.fetchPdf.mockResolvedValue({ data: { invoicePdf: 'JVBERi0x' } });

    await download('invoice-7', 'INV-007');

    expect(gql.fetchPdf).toHaveBeenCalledWith({ variables: { id: 'invoice-7' } });
    expect(file.downloadBase64File).toHaveBeenCalledWith(
      'Invoice-INV-007.pdf',
      'application/pdf',
      'JVBERi0x',
    );
  });

  it('reports the server error instead of saving anything', async () => {
    gql.fetchPdf.mockResolvedValue({ data: undefined, error: new Error('Invoice not found') });

    await download('invoice-7', 'INV-007');

    expect(file.downloadBase64File).not.toHaveBeenCalled();
    expect(await screen.findByText('Invoice not found')).toBeInTheDocument();
  });

  it('says the invoice could not be generated when the server answers with nothing', async () => {
    gql.fetchPdf.mockResolvedValue({ data: undefined });

    await download('invoice-7', 'INV-007');

    expect(await screen.findByText('The invoice could not be generated.')).toBeInTheDocument();
  });

  it('falls back to a generic message for a failure that is not an Error', async () => {
    gql.fetchPdf.mockRejectedValue('offline');

    await download('invoice-7', 'INV-007');

    expect(await screen.findByText('Could not download the invoice')).toBeInTheDocument();
  });

  it('reports whether a download is in flight', () => {
    gql.loading = true;
    const { result } = renderHookWithProviders(() => useInvoiceDownload());

    expect(result.current.downloading).toBe(true);
  });
});
