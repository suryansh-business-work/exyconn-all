import { beforeEach, describe, expect, it, vi } from 'vitest';
import { act } from '@testing-library/react';
import {
  AppLogFixPromptDocument,
  AppLogSource,
  AppLogStatus,
  OpenAppLogsFixPromptDocument,
} from '@exyconn/shell/graphql/generated';
import { useLogActions } from '../../../../src/pages/logs/useLogActions';
import { renderHookWithProviders } from '../../test-utils';
import { logRow } from './log.fixtures';

const spies = vi.hoisted(() => ({
  query: vi.fn(),
  copy: vi.fn(),
  notify: vi.fn(),
  confirm: vi.fn(),
  setStatus: vi.fn(),
  deleteGroup: vi.fn(),
}));

vi.mock('@apollo/client/react', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@apollo/client/react')>()),
  useApolloClient: () => ({ query: spies.query }),
}));
vi.mock('@exyconn/shell/utils/clipboard', () => ({ copyToClipboard: spies.copy }));
vi.mock('@exyconn/shell/components/feedback/NotificationProvider', async (importOriginal) => ({
  ...(await importOriginal<object>()),
  useNotify: () => spies.notify,
}));
vi.mock('@exyconn/shell/components/feedback/ConfirmProvider', async (importOriginal) => ({
  ...(await importOriginal<object>()),
  useConfirm: () => spies.confirm,
}));
vi.mock('@exyconn/shell/graphql/generated', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@exyconn/shell/graphql/generated')>()),
  useSetAppLogGroupStatusMutation: () => [spies.setStatus],
  useDeleteAppLogGroupMutation: () => [spies.deleteGroup],
}));

const onChanged = vi.fn();
const actions = () => renderHookWithProviders(() => useLogActions(onChanged)).result;

describe('useLogActions — prompts for Claude', () => {
  beforeEach(() => {
    for (const spy of Object.values(spies)) {
      spy.mockReset();
    }
    onChanged.mockReset();
    spies.copy.mockResolvedValue(true);
  });

  it('builds one problem’s prompt on the server and copies it', async () => {
    spies.query.mockResolvedValue({ data: { appLogFixPrompt: 'Fix TypeError in Timer.tsx' } });
    const result = actions();
    await act(() => result.current.copyFixPrompt(logRow()));

    expect(spies.query).toHaveBeenCalledWith({
      query: AppLogFixPromptDocument,
      variables: { id: 'grp-1' },
      fetchPolicy: 'network-only',
    });
    expect(spies.copy).toHaveBeenCalledWith('Fix TypeError in Timer.tsx');
    expect(spies.notify).toHaveBeenCalledWith('Copied — paste it into Claude Code to fix it');
  });

  it('copies every open error from one source, or from all of them', async () => {
    spies.query.mockResolvedValue({ data: { openAppLogsFixPrompt: 'Fix all three' } });
    const result = actions();
    await act(() => result.current.copyOpenErrors(AppLogSource.Desktop));
    await act(() => result.current.copyOpenErrors(null));

    expect(spies.query).toHaveBeenNthCalledWith(1, {
      query: OpenAppLogsFixPromptDocument,
      variables: { source: 'DESKTOP' },
      fetchPolicy: 'network-only',
    });
    expect(spies.query).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({ variables: { source: null } }),
    );
    expect(spies.copy).toHaveBeenCalledWith('Fix all three');
  });

  it('copies an empty prompt when the server sends none back', async () => {
    spies.query.mockResolvedValue({ data: undefined });
    const result = actions();
    await act(() => result.current.copyFixPrompt(logRow()));
    await act(() => result.current.copyOpenErrors(null));

    expect(spies.copy).toHaveBeenNthCalledWith(1, '');
    expect(spies.copy).toHaveBeenNthCalledWith(2, '');
  });

  it('says so when the browser blocks the clipboard', async () => {
    spies.query.mockResolvedValue({ data: { appLogFixPrompt: 'prompt' } });
    spies.copy.mockResolvedValue(false);
    const result = actions();
    await act(() => result.current.copyFixPrompt(logRow()));

    expect(spies.notify).toHaveBeenCalledWith(
      'Copy failed — the browser blocked the clipboard',
      'error',
    );
  });

  it('reports why the prompt could not be built', async () => {
    spies.query.mockRejectedValueOnce(new Error('Group not found')).mockRejectedValueOnce('down');
    const result = actions();
    await act(() => result.current.copyFixPrompt(logRow()));
    await act(() => result.current.copyFixPrompt(logRow()));

    expect(spies.copy).not.toHaveBeenCalled();
    expect(spies.notify).toHaveBeenNthCalledWith(1, 'Group not found', 'error');
    expect(spies.notify).toHaveBeenNthCalledWith(2, 'Could not build the prompt', 'error');
  });

  it('is busy while a prompt is being built, and free again after', async () => {
    let finish: (value: unknown) => void = () => undefined;
    spies.query.mockReturnValue(
      new Promise((resolve) => {
        finish = resolve;
      }),
    );
    const result = actions();
    expect(result.current.copying).toBe(false);

    let pending: Promise<void> = Promise.resolve();
    act(() => {
      pending = result.current.copyFixPrompt(logRow());
    });
    expect(result.current.copying).toBe(true);

    await act(async () => {
      finish({ data: { appLogFixPrompt: 'prompt' } });
      await pending;
    });
    expect(result.current.copying).toBe(false);
  });
});

describe('useLogActions — status and delete', () => {
  beforeEach(() => {
    for (const spy of Object.values(spies)) {
      spy.mockReset();
    }
    onChanged.mockReset();
  });

  it.each([
    [AppLogStatus.Resolved, 'Marked resolved'],
    [AppLogStatus.Ignored, 'Marked ignored'],
    [AppLogStatus.Open, 'Marked open'],
  ])('moves a problem to %s and says so', async (status, notice) => {
    spies.setStatus.mockResolvedValue({ data: {} });
    const result = actions();
    let done = false;
    await act(async () => {
      done = await result.current.changeStatus(logRow(), status);
    });

    expect(done).toBe(true);
    expect(spies.setStatus).toHaveBeenCalledWith({ variables: { id: 'grp-1', status } });
    expect(spies.notify).toHaveBeenCalledWith(notice);
    expect(onChanged).toHaveBeenCalledTimes(1);
  });

  it('keeps the problem as it was when the status change fails', async () => {
    spies.setStatus.mockRejectedValueOnce(new Error('Forbidden')).mockRejectedValueOnce(42);
    const result = actions();
    let first = true;
    let second = true;
    await act(async () => {
      first = await result.current.changeStatus(logRow(), AppLogStatus.Resolved);
      second = await result.current.changeStatus(logRow(), AppLogStatus.Resolved);
    });

    expect([first, second]).toEqual([false, false]);
    expect(spies.notify).toHaveBeenNthCalledWith(1, 'Forbidden', 'error');
    expect(spies.notify).toHaveBeenNthCalledWith(2, 'Could not update the log', 'error');
    expect(onChanged).not.toHaveBeenCalled();
  });
});
