import { describe, it, expect, vi, beforeEach, beforeAll } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import {
  validateUserPassword, protectedFileName, formatSize, requestProtectedPdf, SERVICE_UNAVAILABLE,
} from './utils';
import ProtectPdf from './index';

vi.mock('../../shared/components/ToolLayout/ToolLayout', async () => {
  const React = await import('react');
  return {
    default: ({ children, toolName }: { children?: React.ReactNode; toolName?: string }) =>
      React.createElement('div', null, React.createElement('h1', null, toolName), children),
  };
});

vi.mock('../../shared/components/PdfPreview', () => ({ PdfPreview: () => null }));

const fetchMock = vi.fn();
const VALID_KEY = 'open1234';
const pdfFile = () => new File(['%PDF-1.4'], 'report.pdf', { type: 'application/pdf' });

beforeAll(() => {
  vi.stubGlobal('fetch', fetchMock);
  URL.createObjectURL = vi.fn(() => 'blob:mock') as typeof URL.createObjectURL;
  URL.revokeObjectURL = vi.fn();
});

beforeEach(() => {
  fetchMock.mockReset();
});

describe('protect-pdf utils', () => {
  describe('validateUserPassword', () => {
    it('requires a password', () => {
      expect(validateUserPassword('')).toBe('User password is required.');
    });
    it('enforces the minimum length', () => {
      expect(validateUserPassword('abc')).toBe('Password must be at least 4 characters.');
    });
    it('accepts a valid password', () => {
      expect(validateUserPassword(VALID_KEY)).toBe('');
    });
  });

  describe('protectedFileName', () => {
    it('appends -protected before the extension', () => {
      expect(protectedFileName('report.pdf')).toBe('report-protected.pdf');
    });
    it('handles uppercase extensions', () => {
      expect(protectedFileName('REPORT.PDF')).toBe('REPORT-protected.pdf');
    });
    it('handles names without an extension', () => {
      expect(protectedFileName('report')).toBe('report-protected.pdf');
    });
  });

  describe('formatSize', () => {
    it('formats kilobytes', () => expect(formatSize(2048)).toBe('2.0 KB'));
    it('formats megabytes', () => expect(formatSize(3 * 1024 * 1024)).toBe('3.00 MB'));
  });

  describe('requestProtectedPdf', () => {
    it('posts the file and passwords as multipart form data', async () => {
      const blob = new Blob(['encrypted'], { type: 'application/pdf' });
      fetchMock.mockResolvedValueOnce({ ok: true, status: 200, blob: () => Promise.resolve(blob) });
      const out = await requestProtectedPdf('http://api/protect', pdfFile(), VALID_KEY, 'owner567');
      expect(out).toBe(blob);
      const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
      expect(url).toBe('http://api/protect');
      expect(init.method).toBe('POST');
      const body = init.body as FormData;
      expect((body.get('file') as File).name).toBe('report.pdf');
      expect(body.get('userPassword')).toBe(VALID_KEY);
      expect(body.get('ownerPassword')).toBe('owner567');
    });
    it('omits the owner password when empty', async () => {
      fetchMock.mockResolvedValueOnce({ ok: true, status: 200, blob: () => Promise.resolve(new Blob()) });
      await requestProtectedPdf('http://api/protect', pdfFile(), VALID_KEY, '');
      const body = (fetchMock.mock.calls[0] as [string, RequestInit])[1].body as FormData;
      expect(body.get('ownerPassword')).toBeNull();
    });
    it('throws SERVICE_UNAVAILABLE on a 503', async () => {
      fetchMock.mockResolvedValueOnce({ ok: false, status: 503, json: () => Promise.reject(new Error('no body')) });
      await expect(requestProtectedPdf('http://api/protect', pdfFile(), VALID_KEY, ''))
        .rejects.toThrow(SERVICE_UNAVAILABLE);
    });
    it('surfaces the server error message on other failures', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: false, status: 400, json: () => Promise.resolve({ error: 'Invalid PDF file' }),
      });
      await expect(requestProtectedPdf('http://api/protect', pdfFile(), VALID_KEY, ''))
        .rejects.toThrow('Invalid PDF file');
    });
    it('falls back to a status message when the error body is not JSON', async () => {
      fetchMock.mockResolvedValueOnce({ ok: false, status: 500, json: () => Promise.reject(new Error('no body')) });
      await expect(requestProtectedPdf('http://api/protect', pdfFile(), VALID_KEY, ''))
        .rejects.toThrow('Request failed with status 500.');
    });
  });
});

describe('ProtectPdf component', () => {
  const selectFile = (container: HTMLElement) => {
    const input = container.querySelector('input[type="file"]') as HTMLInputElement;
    fireEvent.change(input, { target: { files: [pdfFile()] } });
  };

  it('renders the upload zone with a disabled protect button', () => {
    render(<ProtectPdf />);
    expect(screen.getByRole('heading', { name: 'Protect PDF' })).toBeInTheDocument();
    expect(screen.getByText('Drag & Drop PDF Here')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Protect PDF' })).toBeDisabled();
    expect(screen.getByText(/AES-256/)).toBeInTheDocument();
  });

  it('shows an inline error for a too-short user password', async () => {
    const { container } = render(<ProtectPdf />);
    selectFile(container);
    fireEvent.change(screen.getByLabelText(/User Password/i), { target: { value: 'ab' } });
    fireEvent.click(screen.getByRole('button', { name: 'Protect PDF' }));
    expect(await screen.findByText('Password must be at least 4 characters.')).toBeInTheDocument();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('offers the encrypted download after a successful request', async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true, status: 200,
      blob: () => Promise.resolve(new Blob(['encrypted'], { type: 'application/pdf' })),
    });
    const { container } = render(<ProtectPdf />);
    selectFile(container);
    fireEvent.change(screen.getByLabelText(/User Password/i), { target: { value: VALID_KEY } });
    fireEvent.click(screen.getByRole('button', { name: 'Protect PDF' }));
    expect(await screen.findByRole('button', { name: 'Download Protected PDF' })).toBeInTheDocument();
  });

  it('shows the service-unavailable state on a 503', async () => {
    fetchMock.mockResolvedValueOnce({ ok: false, status: 503, json: () => Promise.reject(new Error('no body')) });
    const { container } = render(<ProtectPdf />);
    selectFile(container);
    fireEvent.change(screen.getByLabelText(/User Password/i), { target: { value: VALID_KEY } });
    fireEvent.click(screen.getByRole('button', { name: 'Protect PDF' }));
    expect(await screen.findByText(/temporarily unavailable/)).toBeInTheDocument();
    await waitFor(() =>
      expect(screen.queryByRole('button', { name: 'Download Protected PDF' })).not.toBeInTheDocument());
  });
});
