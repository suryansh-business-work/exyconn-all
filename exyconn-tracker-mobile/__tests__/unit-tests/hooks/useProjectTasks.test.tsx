import { act, renderHook, waitFor } from '@testing-library/react';
import type { TrackerTask } from '@exyconn/tracker-core';
import { describe, expect, it, vi } from 'vitest';
import { useProjectTasks } from '../../../src/hooks/useProjectTasks';
import { tracker } from '../../../src/tracker/instance';
import { deferred } from './deferred';

vi.mock('../../../src/tracker/instance', () => ({ tracker: { getTasks: vi.fn() } }));

const TASK: TrackerTask = { id: 't1', key: 'EXY-14', title: 'Fix login', assignedToMe: true };

describe('useProjectTasks', () => {
  it('asks for nothing while no project is chosen', () => {
    const { result } = renderHook(() => useProjectTasks(''));
    expect(result.current).toEqual({ tasks: [], loading: false });
    expect(tracker.getTasks).not.toHaveBeenCalled();
  });

  it("loads the chosen project's tickets", async () => {
    vi.mocked(tracker.getTasks).mockResolvedValue([TASK]);
    const { result } = renderHook(() => useProjectTasks('p1'));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.tasks).toEqual([TASK]);
    expect(tracker.getTasks).toHaveBeenCalledWith('p1');
  });

  it('logs a failed read and offers no tickets', async () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const cause = new Error('offline');
    vi.mocked(tracker.getTasks).mockRejectedValue(cause);
    const { result } = renderHook(() => useProjectTasks('p1'));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.tasks).toEqual([]);
    expect(error).toHaveBeenCalledWith('Loading tickets failed', cause);
  });

  it("drops the old project's tickets at once, and its late answer too", async () => {
    const first = deferred<TrackerTask[]>();
    vi.mocked(tracker.getTasks).mockReturnValueOnce(first.promise).mockResolvedValueOnce([]);
    const { result, rerender } = renderHook(({ id }) => useProjectTasks(id), {
      initialProps: { id: 'p1' },
    });
    expect(result.current.loading).toBe(true);
    rerender({ id: 'p2' });
    await waitFor(() => expect(result.current.loading).toBe(false));
    await act(async () => {
      first.resolve([TASK]);
      await first.promise;
    });
    expect(result.current.tasks).toEqual([]);
  });

  it('stops loading when the project is cleared', () => {
    vi.mocked(tracker.getTasks).mockReturnValue(deferred<TrackerTask[]>().promise);
    const { result, rerender } = renderHook(({ id }) => useProjectTasks(id), {
      initialProps: { id: 'p1' },
    });
    rerender({ id: '' });
    expect(result.current).toEqual({ tasks: [], loading: false });
  });
});
