import { beforeEach, describe, expect, it, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import { AiJobStatus } from '@exyconn/shell/graphql/generated';
import { useAiJobQueue } from '../../../../src/pages/ai/useAiJobQueue';

interface Job {
  id: string;
  status: AiJobStatus;
  queuedAt?: string | null;
}

const query = vi.hoisted(() => ({
  data: undefined as undefined | { listAiJobs: Job[] },
  options: undefined as unknown,
  refetch: vi.fn(),
  startPolling: vi.fn(),
  stopPolling: vi.fn(),
}));

vi.mock('@exyconn/shell/graphql/generated', async (orig) => ({
  ...(await orig<typeof import('@exyconn/shell/graphql/generated')>()),
  useAiJobsInFlightQuery: (options: unknown) => {
    query.options = options;
    return {
      data: query.data,
      refetch: query.refetch,
      startPolling: query.startPolling,
      stopPolling: query.stopPolling,
    };
  },
}));

const QUEUED_AT = '2026-10-01T10:00:00.000Z';
const jobs = (...list: Job[]) => ({ listAiJobs: list });

describe('useAiJobQueue', () => {
  beforeEach(() => {
    query.data = undefined;
    vi.clearAllMocks();
  });

  it('makes no requests while nothing is in flight', () => {
    const reload = vi.fn();
    const { result } = renderHook(() => useAiJobQueue(reload));
    expect(query.options).toEqual({ fetchPolicy: 'network-only' });
    expect(result.current.inFlight).toBe(0);
    expect(result.current.refresh).toBe(query.refetch);
    expect(query.stopPolling).toHaveBeenCalled();
    expect(query.startPolling).not.toHaveBeenCalled();
    expect(reload).not.toHaveBeenCalled();
  });

  it('counts running jobs and queued jobs that were actually submitted, never drafts', () => {
    query.data = jobs(
      { id: '1', status: AiJobStatus.Running },
      { id: '2', status: AiJobStatus.Queued, queuedAt: QUEUED_AT },
      { id: '3', status: AiJobStatus.Queued, queuedAt: null },
      { id: '4', status: AiJobStatus.Succeeded, queuedAt: QUEUED_AT },
    );
    const { result } = renderHook(() => useAiJobQueue(vi.fn()));
    expect(result.current.inFlight).toBe(2);
    expect(query.startPolling).toHaveBeenCalledWith(3000);
  });

  it('does not reload on the first answer, then reloads on every later one', () => {
    const reload = vi.fn();
    query.data = jobs({ id: '1', status: AiJobStatus.Running });
    const { rerender } = renderHook(() => useAiJobQueue(reload));
    expect(reload).not.toHaveBeenCalled();
    query.data = jobs({ id: '1', status: AiJobStatus.Succeeded });
    rerender();
    expect(reload).toHaveBeenCalledTimes(1);
  });

  it('stops polling once the queue drains, and when unmounted mid-queue', () => {
    query.data = jobs({ id: '1', status: AiJobStatus.Running });
    const { rerender, unmount } = renderHook(() => useAiJobQueue(vi.fn()));
    query.data = jobs({ id: '1', status: AiJobStatus.Failed });
    rerender();
    expect(query.stopPolling).toHaveBeenCalled();
    query.data = jobs({ id: '1', status: AiJobStatus.Running });
    rerender();
    query.stopPolling.mockClear();
    unmount();
    expect(query.stopPolling).toHaveBeenCalledTimes(1);
  });
});
