import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useBodyDownloads } from '../../../../src/pages/legal/useBodyDownloads';

type Source = string | (() => Promise<string>);

const exporter = vi.hoisted(() => ({
  save: vi.fn<(source: Source, title: string, format: 'pdf' | 'docx') => Promise<void>>(),
}));

vi.mock('@exyconn/shell/hooks/useRichTextExport', () => ({
  useRichTextExport: () => exporter.save,
}));

const ROW = { id: 'contract-1', title: 'Master services agreement' };

/** The source the export was handed on its nth call, run to read the HTML it fetches. */
async function fetchedBy(call: number) {
  const source = exporter.save.mock.calls[call][0];
  if (typeof source === 'string') {
    throw new TypeError('Expected the body to be fetched, not handed over');
  }
  return source();
}

describe('useBodyDownloads', () => {
  beforeEach(() => {
    exporter.save.mockReset().mockResolvedValue(undefined);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('downloads a row as a PDF, fetching its body by id first', async () => {
    const fetchBody = vi.fn().mockResolvedValue('<p>Terms</p>');
    const { result } = renderHook(() => useBodyDownloads(fetchBody));

    result.current.pdf(ROW);

    expect(exporter.save).toHaveBeenCalledWith(
      expect.any(Function),
      'Master services agreement',
      'pdf',
    );
    expect(fetchBody).not.toHaveBeenCalled();
    await expect(fetchedBy(0)).resolves.toBe('<p>Terms</p>');
    expect(fetchBody).toHaveBeenCalledWith('contract-1');
  });

  it('downloads a row as a Word document', () => {
    const { result } = renderHook(() => useBodyDownloads(vi.fn()));

    result.current.docx(ROW);

    expect(exporter.save).toHaveBeenCalledWith(
      expect.any(Function),
      'Master services agreement',
      'docx',
    );
  });

  it('logs a download that fails instead of leaving the rejection unhandled', async () => {
    const failure = new Error('Export crashed');
    exporter.save.mockRejectedValue(failure);
    const logged = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const { result } = renderHook(() => useBodyDownloads(vi.fn()));

    result.current.pdf(ROW);

    await waitFor(() => expect(logged).toHaveBeenCalledWith('Download failed', failure));
  });

  it('keeps the same handlers across renders while the fetcher is unchanged', () => {
    const fetchBody = vi.fn();
    const { result, rerender } = renderHook(({ fetcher }) => useBodyDownloads(fetcher), {
      initialProps: { fetcher: fetchBody },
    });
    const first = result.current;

    rerender({ fetcher: fetchBody });
    expect(result.current).toBe(first);

    rerender({ fetcher: vi.fn() });
    expect(result.current).not.toBe(first);
  });
});
