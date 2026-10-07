import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useSalarySlipPdfLazyQuery } from '@/graphql/generated';
import { downloadBase64File } from '@/utils/file';
import { usePayslipDownload } from '@/hooks/usePayslipDownload';

const { notify } = vi.hoisted(() => ({ notify: vi.fn() }));

vi.mock('@/components/feedback/NotificationProvider', () => ({ useNotify: () => notify }));
vi.mock('@/utils/file', () => ({ downloadBase64File: vi.fn() }));
vi.mock('@/graphql/generated', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/graphql/generated')>()),
  useSalarySlipPdfLazyQuery: vi.fn(),
}));

const fetchPdf = vi.fn();

function setup(loading = false) {
  vi.mocked(useSalarySlipPdfLazyQuery).mockReturnValue([
    fetchPdf,
    { loading },
  ] as unknown as ReturnType<typeof useSalarySlipPdfLazyQuery>);
  return renderHook(() => usePayslipDownload()).result;
}

const PDF = {
  filename: 'payslip-2026-09.pdf',
  contentType: 'application/pdf',
  contentBase64: 'JVBERi0=',
};

beforeEach(() => {
  notify.mockReset();
  fetchPdf.mockReset();
  vi.mocked(downloadBase64File).mockReset();
});

describe('usePayslipDownload', () => {
  it('always asks the server afresh for the slip', () => {
    setup();
    expect(useSalarySlipPdfLazyQuery).toHaveBeenCalledWith({ fetchPolicy: 'network-only' });
  });

  it('reports whether a download is running', () => {
    expect(setup(true).current.downloading).toBe(true);
    expect(setup(false).current.downloading).toBe(false);
  });

  it('downloads the generated PDF', async () => {
    fetchPdf.mockResolvedValue({ data: { salarySlipPdf: PDF } });
    const result = setup();
    await act(() => result.current.download('slip-9'));
    expect(fetchPdf).toHaveBeenCalledWith({ variables: { id: 'slip-9' } });
    expect(downloadBase64File).toHaveBeenCalledWith(
      PDF.filename,
      PDF.contentType,
      PDF.contentBase64,
    );
    expect(notify).not.toHaveBeenCalled();
  });

  it("shows the query's error and downloads nothing", async () => {
    fetchPdf.mockResolvedValue({ data: undefined, error: new Error('Not your payslip') });
    const result = setup();
    await act(() => result.current.download('slip-9'));
    expect(downloadBase64File).not.toHaveBeenCalled();
    expect(notify).toHaveBeenCalledWith('Not your payslip', 'error');
  });

  it('explains a slip the server returned nothing for', async () => {
    fetchPdf.mockResolvedValue({ data: undefined, error: undefined });
    const result = setup();
    await act(() => result.current.download('slip-9'));
    expect(notify).toHaveBeenCalledWith('The payslip could not be generated.', 'error');
  });

  it('falls back to a generic message for a non-Error failure', async () => {
    fetchPdf.mockRejectedValue('offline');
    const result = setup();
    await act(() => result.current.download('slip-9'));
    expect(notify).toHaveBeenCalledWith('Could not download the payslip', 'error');
  });
});
