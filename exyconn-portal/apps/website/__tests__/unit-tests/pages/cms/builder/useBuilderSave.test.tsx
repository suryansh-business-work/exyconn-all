import { beforeEach, describe, expect, it, vi } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import type { LiveEditorHandle } from '@exyconn/live-editor';
import { useBuilderSave } from '../../../../../src/pages/cms/builder/useBuilderSave';

const spies = vi.hoisted(() => ({
  compile: vi.fn(),
  notify: vi.fn(),
  saveDraft: vi.fn(),
  publish: vi.fn(),
}));

vi.mock('@exyconn/cms', () => ({ compileHtml: spies.compile }));
vi.mock('@exyconn/shell/components/feedback/NotificationProvider', async (importOriginal) => ({
  ...(await importOriginal<object>()),
  useNotify: () => spies.notify,
}));

const handle: LiveEditorHandle = {
  getDesign: () => ({ html: '<p>Hi</p>', css: 'p { color: red; }' }),
  getProjectData: () => ({}),
};

function mount(current: LiveEditorHandle | null = handle) {
  const editor = { current };
  return renderHook(() =>
    useBuilderSave(editor, { saveDraft: spies.saveDraft, publish: spies.publish }),
  );
}

describe('useBuilderSave', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    spies.compile.mockReset();
    spies.saveDraft.mockResolvedValue({ data: {} });
    spies.publish.mockResolvedValue({ data: {} });
  });

  it('saves the compiled canvas as a draft and clears the unsaved state', async () => {
    const { result } = mount();
    act(() => result.current.markDirty());
    expect(result.current.dirty).toBe(true);

    let saved = false;
    await act(async () => {
      saved = await result.current.save();
    });

    expect(saved).toBe(true);
    expect(spies.compile).toHaveBeenCalledWith('<p>Hi</p>', 'p { color: red; }');
    expect(spies.saveDraft).toHaveBeenCalledWith({
      projectData: {},
      html: '<p>Hi</p>',
      css: 'p { color: red; }',
    });
    expect(spies.notify).toHaveBeenCalledWith('Draft saved');
    expect(result.current.dirty).toBe(false);
    expect(result.current.saving).toBe(false);
  });

  it('saves quietly when asked', async () => {
    const { result } = mount();
    await act(async () => {
      await result.current.save(true);
    });

    expect(spies.saveDraft).toHaveBeenCalledTimes(1);
    expect(spies.notify).not.toHaveBeenCalled();
  });

  it('stays unsaved when an edit lands while the save is in flight', async () => {
    let finish: (value: unknown) => void = () => undefined;
    spies.saveDraft.mockReturnValueOnce(
      new Promise((resolve) => {
        finish = resolve;
      }),
    );
    const { result } = mount();
    act(() => result.current.markDirty());

    let pending: Promise<boolean> = Promise.resolve(false);
    act(() => {
      pending = result.current.save();
    });
    expect(result.current.saving).toBe(true);
    act(() => result.current.markDirty());

    let second = true;
    await act(async () => {
      second = await result.current.save();
    });
    expect(second).toBe(false);

    await act(async () => {
      finish({});
      await pending;
    });
    expect(result.current.dirty).toBe(true);
    expect(spies.saveDraft).toHaveBeenCalledTimes(1);
  });

  it('reports a draft the server refused and keeps it unsaved', async () => {
    spies.saveDraft.mockRejectedValueOnce(new Error('Draft too large'));
    const { result } = mount();
    act(() => result.current.markDirty());

    let saved = true;
    await act(async () => {
      saved = await result.current.save();
    });

    expect(saved).toBe(false);
    expect(spies.notify).toHaveBeenCalledWith('Draft too large', 'error');
    expect(result.current.dirty).toBe(true);
  });

  it('stops a broken placeholder at save time, before the server sees it', async () => {
    spies.compile.mockImplementationOnce(() => {
      throw new Error('Unknown component "hero"');
    });
    const { result } = mount();
    await act(async () => {
      await result.current.save();
    });

    expect(spies.saveDraft).not.toHaveBeenCalled();
    expect(spies.notify).toHaveBeenCalledWith('Unknown component "hero"', 'error');
  });

  it('falls back to a generic message and saves nothing without an editor', async () => {
    spies.saveDraft.mockRejectedValueOnce('offline');
    const { result } = mount();
    await act(async () => {
      await result.current.save();
    });
    expect(spies.notify).toHaveBeenCalledWith('Could not save the draft', 'error');

    const empty = mount(null);
    let saved = true;
    await act(async () => {
      saved = await empty.result.current.save();
    });
    expect(saved).toBe(false);
    expect(spies.saveDraft).toHaveBeenCalledTimes(1);
  });
});
