import { describe, it, expect, vi, beforeEach, beforeAll } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import {
  unlockedFileName, formatSize, requestUnlockedPdf, SERVICE_UNAVAILABLE, INCORRECT_PASSWORD,
} from './utils';
import UnlockPdf from './index';

vi.mock('../../shared/components/ToolLayout/ToolLayout', async () => {
  const React = await import('react');
  return {
    default: ({ children, toolName }: { children?: React.ReactNode; toolName?: string }) =>
      React.createElement('div', null, React.createElement('h1', null, toolName), children),
  };
});

const fetchMock = vi.fn();
const VALID_KEY = 'open1234';
const pdfFile = () => new File(['%PDF-1.4'], 'secret.pdf', { type: 'application/pdf' });

beforeAll(() => {
  vi.stubGlobal('fetch', fetchMock);
  URL.createObjectURL = vi.fn(() => 'blob:mock') as typeof URL.createObjectURL;
  URL.revokeObjectURL = vi.fn();
});

beforeEach(() => {
  fetchMock.mockReset();
});

describe('unlock-pdf utils', () => {
  describe('unlockedFileName', () => {
    it('appends -unlocked before the extension', () => {
      expect(unlockedFileName('secret.pdf')).toBe('secret-unlocked.pdf');
    });
    it('handles names without an extension', () => {
      expect(unlockedFileName('secret')).toBe('secret-unlocked.pdf');
    });
  });

  describe('formatSize', () => {
    it('formats kilobytes', () => expect(formatSize(1024)).toBe('1.0 KB'));
    it('formats megabytes', () => expect(formatSize(2 * 1024 * 1024)).toBe('2.00 MB'));
  });

  describe('requestUnlockedPdf', () => {
    it('posts the file and password as multipart form data', async () => {
      const blob = new Blob(['decrypted'], { type: 'application/pdf' });
      fetchMock.mockResolvedValueOnce({ ok: true, status: 200, blob: () => Promise.resolve(blob) });
      const out = await requestUnlockedPdf('http://api/unlock', pdfFile(), VALID_KEY);
      expect(out).toBe(blob);
      const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
      expect(url).toBe('http://api/unlock');
      expect(init.method).toBe('POST');
      const body = init.body as FormData;
      expect((body.get('file') as File).name).toBe('secret.pdf');
      expect(body.get('password')).toBe(VALID_KEY);
    });
    it('throws INCORRECT_PASSWORD on a 400', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: false, status: 400, json: () => Promise.resolve({ error: 'Incorrect password' }),
      });
      await expect(requestUnlockedPdf('http://api/unlock', pdfFile(), 'wrong123'))
        .rejects.toThrow(INCORRECT_PASSWORD);
    });
    it('throws SERVICE_UNAVAILABLE on a 503', async () => {
      fetchMock.mockResolvedValueOnce({ ok: false, status: 503, json: () => Promise.reject(new Error('no body')) });
      await expect(requestUnlockedPdf('http://api/unlock', pdfFile(), VALID_KEY))
        .rejects.toThrow(SERVICE_UNAVAILABLE);
    });
    it('surfaces the server error message on other failures', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: false, status: 500, json: () => Promise.resolve({ error: 'Decryption failed' }),
      });
      await expect(requestUnlockedPdf('http://api/unlock', pdfFile(), VALID_KEY))
        .rejects.toThrow('Decryption failed');
    });
  });
});

describe('UnlockPdf component', () => {
  const selectFile = (container: HTMLElement) => {
    const input = container.querySelector('input[type="file"]') as HTMLInputElement;
    fireEvent.change(input, { target: { files: [pdfFile()] } });
  };

  it('renders the upload zone with a disabled unlock button', () => {
    render(<UnlockPdf />);
    expect(screen.getByRole('heading', { name: 'Unlock PDF' })).toBeInTheDocument();
    expect(screen.getByText('Drag & Drop Protected PDF')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Unlock PDF' })).toBeDisabled();
  });

  it('requires a password before submitting', async () => {
    const { container } = render(<UnlockPdf />);
    selectFile(container);
    fireEvent.click(screen.getByRole('button', { name: 'Unlock PDF' }));
    expect(await screen.findByText('Password is required.')).toBeInTheDocument();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('shows an inline field error for an incorrect password', async () => {
    fetchMock.mockResolvedValueOnce({
      ok: false, status: 400, json: () => Promise.resolve({ error: 'Incorrect password' }),
    });
    const { container } = render(<UnlockPdf />);
    selectFile(container);
    fireEvent.change(screen.getByLabelText(/PDF Password/i), { target: { value: 'wrong123' } });
    fireEvent.click(screen.getByRole('button', { name: 'Unlock PDF' }));
    expect(await screen.findByText('Incorrect password. Please try again.')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Download Unlocked PDF' })).not.toBeInTheDocument();
  });

  it('offers the unlocked download after a successful request', async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true, status: 200,
      blob: () => Promise.resolve(new Blob(['decrypted'], { type: 'application/pdf' })),
    });
    const { container } = render(<UnlockPdf />);
    selectFile(container);
    fireEvent.change(screen.getByLabelText(/PDF Password/i), { target: { value: VALID_KEY } });
    fireEvent.click(screen.getByRole('button', { name: 'Unlock PDF' }));
    expect(await screen.findByText('PDF unlocked successfully!')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Download Unlocked PDF' })).toBeInTheDocument();
  });

  it('shows the service-unavailable state on a 503', async () => {
    fetchMock.mockResolvedValueOnce({ ok: false, status: 503, json: () => Promise.reject(new Error('no body')) });
    const { container } = render(<UnlockPdf />);
    selectFile(container);
    fireEvent.change(screen.getByLabelText(/PDF Password/i), { target: { value: VALID_KEY } });
    fireEvent.click(screen.getByRole('button', { name: 'Unlock PDF' }));
    expect(await screen.findByText(/temporarily unavailable/)).toBeInTheDocument();
    await waitFor(() =>
      expect(screen.queryByRole('button', { name: 'Download Unlocked PDF' })).not.toBeInTheDocument());
  });
});
