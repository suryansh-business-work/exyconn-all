import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import type { LiveEditorHandle } from '@exyconn/live-editor';
import { useBuilderSave } from '../../../../../src/pages/cms/builder/useBuilderSave';

const spies = vi.hoisted(() => ({
  notify: vi.fn(),
  saveDraft: vi.fn(),
  publish: vi.fn(),
}));

vi.mock('@exyconn/cms', () => ({ compileHtml: () => [] }));
vi.mock('@exyconn/shell/components/feedback/NotificationProvider', async (importOriginal) => ({
  ...(await importOriginal<object>()),
  useNotify: () => spies.notify,
}));

const handle: LiveEditorHandle = {
  getDesign: () => ({ html: '<p>Hi</p>', css: '' }),
  getProjectData: () => ({}),
};

/** The canvas ref, stable across renders like the builder's own `useRef`. */
const mount = () => {
  const editor = { current: handle };
  return renderHook(() =>
    useBuilderSave(editor, { saveDraft: spies.saveDraft, publish: spies.publish }),
  );
};

const PUBLISHED = 'Published — the site shows this version now';

describe('useBuilderSave publishing', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    spies.saveDraft.mockResolvedValue({ data: {} });
    spies.publish.mockResolvedValue({ data: {} });
  });

  it('publishes a saved page straight away', async () => {
    const { result } = mount();
    await act(async () => {
      await result.current.publish();
    });

    expect(spies.saveDraft).not.toHaveBeenCalled();
    expect(spies.publish).toHaveBeenCalledTimes(1);
    expect(spies.notify).toHaveBeenCalledWith(PUBLISHED, 'success');
    expect(result.current.publishing).toBe(false);
  });

  it('saves unsaved work quietly before publishing it', async () => {
    const { result } = mount();
    act(() => result.current.markDirty());
    await act(async () => {
      await result.current.publish();
    });

    expect(spies.saveDraft).toHaveBeenCalledTimes(1);
    expect(spies.publish).toHaveBeenCalledTimes(1);
    expect(spies.notify).not.toHaveBeenCalledWith('Draft saved');
    expect(result.current.dirty).toBe(false);
  });

  it('does not publish when the save before it failed', async () => {
    spies.saveDraft.mockRejectedValueOnce(new Error('Draft too large'));
    const { result } = mount();
    act(() => result.current.markDirty());
    await act(async () => {
      await result.current.publish();
    });

    expect(spies.publish).not.toHaveBeenCalled();
    expect(spies.notify).toHaveBeenCalledWith('Draft too large', 'error');
  });

  it("shows the server's refusal to publish", async () => {
    spies.publish.mockRejectedValueOnce(new Error('The page has no title'));
    const { result } = mount();
    await act(async () => {
      await result.current.publish();
    });

    expect(spies.notify).toHaveBeenCalledWith('The page has no title', 'error');
    expect(result.current.publishing).toBe(false);
  });

  it('falls back to a generic message for a refusal without a reason', async () => {
    spies.publish.mockRejectedValueOnce('offline');
    const { result } = mount();
    await act(async () => {
      await result.current.publish();
    });

    expect(spies.notify).toHaveBeenCalledWith('Could not publish', 'error');
  });
});

describe('useBuilderSave autosave', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    spies.saveDraft.mockResolvedValue({ data: {} });
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it('saves unsaved work every thirty seconds, quietly, and stops once saved', async () => {
    const { result } = mount();
    await act(async () => {
      await vi.advanceTimersByTimeAsync(30_000);
    });
    expect(spies.saveDraft).not.toHaveBeenCalled();

    act(() => result.current.markDirty());
    await act(async () => {
      await vi.advanceTimersByTimeAsync(29_999);
    });
    expect(spies.saveDraft).not.toHaveBeenCalled();

    await act(async () => {
      await vi.advanceTimersByTimeAsync(1);
    });
    expect(spies.saveDraft).toHaveBeenCalledTimes(1);
    expect(spies.notify).not.toHaveBeenCalled();
    expect(result.current.dirty).toBe(false);

    await act(async () => {
      await vi.advanceTimersByTimeAsync(60_000);
    });
    expect(spies.saveDraft).toHaveBeenCalledTimes(1);
  });

  it('reports an autosave that failed beyond the draft itself', async () => {
    spies.saveDraft.mockRejectedValueOnce(new Error('Draft refused'));
    spies.notify.mockImplementationOnce(() => {
      throw new Error('Notifier unavailable');
    });
    const { result } = mount();
    act(() => result.current.markDirty());

    await act(async () => {
      await vi.advanceTimersByTimeAsync(30_000);
    });

    expect(spies.notify).toHaveBeenLastCalledWith('Notifier unavailable', 'error');
  });
});
