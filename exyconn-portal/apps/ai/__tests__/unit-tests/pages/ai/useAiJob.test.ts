import { beforeEach, describe, expect, it, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import { AiJobStatus, type GetAiJobQuery } from '@exyconn/shell/graphql/generated';
import { useAiJob } from '../../../../src/pages/ai/useAiJob';

const query = vi.hoisted(() => ({
  result: {} as { data?: { getAiJob: Partial<GetAiJobQuery['getAiJob']> }; loading: boolean },
  options: undefined as unknown,
  startPolling: vi.fn(),
  stopPolling: vi.fn(),
}));

vi.mock('@exyconn/shell/graphql/generated', async (orig) => ({
  ...(await orig<typeof import('@exyconn/shell/graphql/generated')>()),
  useGetAiJobQuery: (options: unknown) => {
    query.options = options;
    return { ...query.result, startPolling: query.startPolling, stopPolling: query.stopPolling };
  },
}));

const withStatus = (status: AiJobStatus) => ({
  data: { getAiJob: { id: 'job-1', status } },
  loading: false,
});

describe('useAiJob', () => {
  beforeEach(() => {
    query.startPolling.mockClear();
    query.stopPolling.mockClear();
  });

  it('reads the job from the network every time', () => {
    query.result = withStatus(AiJobStatus.Succeeded);
    renderHook(() => useAiJob('job-1'));
    expect(query.options).toEqual({ variables: { id: 'job-1' }, fetchPolicy: 'network-only' });
  });

  it('polls every 2 seconds while there is no job yet', () => {
    query.result = { loading: true };
    const { result } = renderHook(() => useAiJob('job-1'));
    expect(result.current).toEqual({ job: undefined, loading: true, waiting: true });
    expect(query.startPolling).toHaveBeenCalledWith(2000);
  });

  it.each([AiJobStatus.Queued, AiJobStatus.Running])('keeps polling a %s job', (status) => {
    query.result = withStatus(status);
    const { result } = renderHook(() => useAiJob('job-1'));
    expect(result.current.waiting).toBe(true);
    expect(query.startPolling).toHaveBeenCalledWith(2000);
    expect(query.stopPolling).not.toHaveBeenCalled();
  });

  it.each([AiJobStatus.Succeeded, AiJobStatus.Failed])('stops polling a %s job', (status) => {
    query.result = withStatus(status);
    const { result } = renderHook(() => useAiJob('job-1'));
    expect(result.current.waiting).toBe(false);
    expect(result.current.job?.status).toBe(status);
    expect(query.startPolling).not.toHaveBeenCalled();
    expect(query.stopPolling).toHaveBeenCalled();
  });

  it('stops polling once a running job settles, and on unmount', () => {
    query.result = withStatus(AiJobStatus.Running);
    const { rerender, unmount } = renderHook(() => useAiJob('job-1'));
    query.result = withStatus(AiJobStatus.Succeeded);
    rerender();
    expect(query.stopPolling).toHaveBeenCalled();
    query.stopPolling.mockClear();
    unmount();
    expect(query.startPolling).toHaveBeenCalledTimes(1);
  });

  it('stops polling when unmounted while still waiting', () => {
    query.result = withStatus(AiJobStatus.Queued);
    const { unmount } = renderHook(() => useAiJob('job-1'));
    unmount();
    expect(query.stopPolling).toHaveBeenCalledTimes(1);
  });
});
