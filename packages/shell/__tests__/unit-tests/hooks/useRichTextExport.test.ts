import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { exportRichText } from '@exyconn/rich-text';
import { useRichTextExport } from '@/hooks/useRichTextExport';

const { notify } = vi.hoisted(() => ({ notify: vi.fn() }));

vi.mock('@/components/feedback/NotificationProvider', () => ({ useNotify: () => notify }));
vi.mock('@exyconn/rich-text', () => ({ exportRichText: vi.fn() }));

const FAILED = 'The file could not be created. Check that its images still open, then try again.';

function setup() {
  return renderHook(() => useRichTextExport()).result.current;
}

beforeEach(() => {
  notify.mockReset();
  vi.mocked(exportRichText).mockReset();
  vi.spyOn(console, 'error').mockImplementation(() => undefined);
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('useRichTextExport', () => {
  it('exports HTML already in hand', async () => {
    vi.mocked(exportRichText).mockResolvedValue(undefined);
    const save = setup();
    await act(() => save('<p>Policy</p>', 'Leave policy', 'pdf'));
    expect(exportRichText).toHaveBeenCalledWith('<p>Policy</p>', {
      format: 'pdf',
      title: 'Leave policy',
    });
    expect(notify).not.toHaveBeenCalled();
  });

  it('fetches the HTML first when given a loader', async () => {
    vi.mocked(exportRichText).mockResolvedValue(undefined);
    const load = vi.fn().mockResolvedValue('<h1>Contract</h1>');
    const save = setup();
    await act(() => save(load, 'Contract', 'docx'));
    expect(load).toHaveBeenCalledTimes(1);
    expect(exportRichText).toHaveBeenCalledWith('<h1>Contract</h1>', {
      format: 'docx',
      title: 'Contract',
    });
  });

  it('fetches the HTML afresh on every export, so a saved edit is never missed', async () => {
    vi.mocked(exportRichText).mockResolvedValue(undefined);
    const load = vi.fn().mockResolvedValueOnce('<p>v1</p>').mockResolvedValueOnce('<p>v2</p>');
    const save = setup();
    await act(() => save(load, 'Policy', 'pdf'));
    await act(() => save(load, 'Policy', 'pdf'));
    expect(exportRichText).toHaveBeenNthCalledWith(1, '<p>v1</p>', {
      format: 'pdf',
      title: 'Policy',
    });
    expect(exportRichText).toHaveBeenNthCalledWith(2, '<p>v2</p>', {
      format: 'pdf',
      title: 'Policy',
    });
  });

  it('tells the person there is nothing to download for an empty document', async () => {
    const save = setup();
    await act(() => save('   \n ', 'Empty', 'pdf'));
    expect(exportRichText).not.toHaveBeenCalled();
    expect(notify).toHaveBeenCalledWith(
      'There is nothing to download yet. Write the document first.',
      'info',
    );
  });

  it('tells the person when the fetched document turns out empty', async () => {
    const save = setup();
    await act(() => save(() => Promise.resolve('  '), 'Empty', 'docx'));
    expect(exportRichText).not.toHaveBeenCalled();
    expect(notify).toHaveBeenCalledWith(
      'There is nothing to download yet. Write the document first.',
      'info',
    );
  });

  it('logs and explains a failed export instead of rejecting', async () => {
    const failure = new Error('image 404');
    vi.mocked(exportRichText).mockRejectedValue(failure);
    const save = setup();
    await expect(save('<p>x</p>', 'Doc', 'pdf')).resolves.toBeUndefined();
    expect(console.error).toHaveBeenCalledWith('Rich-text export failed', failure);
    expect(notify).toHaveBeenCalledWith(FAILED, 'error');
  });

  it('explains a loader that fails', async () => {
    const save = setup();
    await act(() => save(() => Promise.reject(new Error('offline')), 'Doc', 'docx'));
    expect(exportRichText).not.toHaveBeenCalled();
    expect(notify).toHaveBeenCalledWith(FAILED, 'error');
  });
});
