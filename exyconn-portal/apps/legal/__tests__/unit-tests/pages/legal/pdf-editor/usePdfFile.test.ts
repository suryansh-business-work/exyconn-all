import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, renderHook, waitFor } from '@testing-library/react';
import { usePdfFile } from '../../../../../src/pages/legal/pdf-editor/usePdfFile';

const pdfjs = vi.hoisted(() => ({ loadPdf: vi.fn() }));

// pdf.js needs a worker and a canvas; the hook only needs something that opens bytes.
vi.mock('../../../../../src/pages/legal/pdf-editor/pdfjs', () => pdfjs);

const BYTES = new Uint8Array([37, 80, 68, 70]);
const DOC = { numPages: 3 };

const respond = (ok = true, status = 200) =>
  vi.fn().mockResolvedValue({
    ok,
    status,
    arrayBuffer: () => Promise.resolve(BYTES.slice().buffer),
  });

describe('usePdfFile', () => {
  beforeEach(() => {
    pdfjs.loadPdf.mockReset().mockResolvedValue(DOC);
    vi.stubGlobal('fetch', respond());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('does nothing while there is no file to open', () => {
    const { result } = renderHook(() => usePdfFile(null));
    expect(result.current).toEqual({ bytes: null, doc: null, error: null });
    expect(fetch).not.toHaveBeenCalled();
  });

  it('downloads the file, opens it and keeps the raw bytes for saving', async () => {
    const { result } = renderHook(() => usePdfFile('https://cdn.example.com/a.pdf'));

    await waitFor(() => expect(result.current.doc).toBe(DOC));
    expect(fetch).toHaveBeenCalledWith('https://cdn.example.com/a.pdf');
    expect(result.current.bytes).toEqual(BYTES);
    expect(result.current.error).toBeNull();
    expect(pdfjs.loadPdf).toHaveBeenCalledWith(BYTES);
  });

  it('says the file could not be downloaded, with the status', async () => {
    vi.stubGlobal('fetch', respond(false, 404));
    const { result } = renderHook(() => usePdfFile('https://cdn.example.com/gone.pdf'));

    await waitFor(() =>
      expect(result.current.error).toBe('The file could not be downloaded (404).'),
    );
    expect(result.current.doc).toBeNull();
    expect(pdfjs.loadPdf).not.toHaveBeenCalled();
  });

  it('falls back to a plain message when opening fails without one', async () => {
    pdfjs.loadPdf.mockRejectedValue('corrupt');
    const { result } = renderHook(() => usePdfFile('https://cdn.example.com/bad.pdf'));

    await waitFor(() => expect(result.current.error).toBe('The PDF could not be opened.'));
  });

  it('drops the answer for a file it has stopped waiting for', async () => {
    let finish: (doc: unknown) => void = () => undefined;
    pdfjs.loadPdf.mockReturnValueOnce(new Promise((resolve) => (finish = resolve)));
    const { result, rerender } = renderHook(({ url }) => usePdfFile(url), {
      initialProps: { url: 'https://cdn.example.com/first.pdf' as string | null },
    });
    await waitFor(() => expect(pdfjs.loadPdf).toHaveBeenCalledTimes(1));

    rerender({ url: null });
    await act(async () => finish({ numPages: 99 }));

    expect(fetch).toHaveBeenCalledTimes(1);
    expect(result.current.doc).toBeNull();
  });

  it('drops a failure for a file it has stopped waiting for', async () => {
    let fail: (error: Error) => void = () => undefined;
    pdfjs.loadPdf.mockReturnValueOnce(new Promise((_resolve, reject) => (fail = reject)));
    const { result, unmount } = renderHook(() => usePdfFile('https://cdn.example.com/x.pdf'));
    await waitFor(() => expect(pdfjs.loadPdf).toHaveBeenCalledTimes(1));

    unmount();
    await act(async () => fail(new Error('late')));

    expect(result.current.error).toBeNull();
  });
});
