import { beforeEach, describe, expect, it, vi } from 'vitest';
import { act } from '@testing-library/react';
import { useLogActions } from '../../../../src/pages/logs/useLogActions';
import { renderHookWithProviders } from '../../test-utils';
import { logRow } from './log.fixtures';

const spies = vi.hoisted(() => ({
  notify: vi.fn(),
  confirm: vi.fn(),
  deleteGroup: vi.fn(),
  setStatus: vi.fn(),
}));

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

async function remove(row = logRow()): Promise<boolean> {
  const { result } = renderHookWithProviders(() => useLogActions(onChanged));
  let done = false;
  await act(async () => {
    done = await result.current.remove(row);
  });
  return done;
}

describe('useLogActions — delete', () => {
  beforeEach(() => {
    for (const spy of Object.values(spies)) {
      spy.mockReset();
    }
    onChanged.mockReset();
    spies.confirm.mockResolvedValue(true);
    spies.deleteGroup.mockResolvedValue({ data: {} });
  });

  it('asks first, naming how many occurrences go with the problem', async () => {
    await remove(logRow({ count: 7 }));

    expect(spies.confirm).toHaveBeenCalledWith({
      title: 'Delete log',
      message: 'Delete "{message}" and all {count} occurrences of it?',
      messageValues: { message: 'Cannot read properties of undefined', count: 7 },
      confirmText: 'Delete',
    });
  });

  it('words the question for a problem seen only once', async () => {
    await remove(logRow({ count: 1 }));

    expect(spies.confirm).toHaveBeenCalledWith(
      expect.objectContaining({ message: 'Delete "{message}" and its only occurrence?' }),
    );
  });

  it('deletes the problem once confirmed, says so and re-reads the list', async () => {
    expect(await remove()).toBe(true);

    expect(spies.deleteGroup).toHaveBeenCalledWith({ variables: { id: 'grp-1' } });
    expect(spies.notify).toHaveBeenCalledWith('Log deleted');
    expect(onChanged).toHaveBeenCalledTimes(1);
  });

  it('deletes nothing when the question is cancelled', async () => {
    spies.confirm.mockResolvedValue(false);

    expect(await remove()).toBe(false);
    expect(spies.deleteGroup).not.toHaveBeenCalled();
    expect(onChanged).not.toHaveBeenCalled();
  });

  it('reports a refused delete and keeps the list as it is', async () => {
    spies.deleteGroup.mockRejectedValueOnce(new Error('Not yours to delete'));
    expect(await remove()).toBe(false);
    expect(spies.notify).toHaveBeenLastCalledWith('Not yours to delete', 'error');

    spies.deleteGroup.mockRejectedValueOnce(null);
    expect(await remove()).toBe(false);
    expect(spies.notify).toHaveBeenLastCalledWith('Could not delete the log', 'error');
    expect(onChanged).not.toHaveBeenCalled();
  });
});
