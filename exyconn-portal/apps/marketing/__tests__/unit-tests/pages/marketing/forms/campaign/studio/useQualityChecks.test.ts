import { beforeEach, describe, expect, it, vi } from 'vitest';
import { act, renderHook, waitFor } from '@testing-library/react';
import { useQualityChecks } from '../../../../../../../src/pages/marketing/forms/campaign/studio/useQualityChecks';

const gql = vi.hoisted(() => ({ checks: vi.fn(), refetch: vi.fn() }));

vi.mock('@exyconn/shell/graphql/generated', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@exyconn/shell/graphql/generated')>()),
  useCampaignQualityChecksQuery: (options: unknown) => gql.checks(options),
}));

const REPORT = { canSend: true, checks: [], counts: { eligible: 3 } };

describe('useQualityChecks', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    gql.refetch.mockResolvedValue({});
    gql.checks.mockReturnValue({
      data: { campaignQualityChecks: REPORT },
      loading: false,
      error: undefined,
      refetch: gql.refetch,
    });
  });

  it('checks the saved draft against its audience', () => {
    const { result } = renderHook(() => useQualityChecks('campaign-1', 'audience-1'));
    expect(gql.checks).toHaveBeenCalledWith({
      variables: { id: 'campaign-1', audienceListId: 'audience-1' },
      skip: false,
      fetchPolicy: 'network-only',
    });
    expect(result.current).toMatchObject({ report: REPORT, loading: false, error: null });
  });

  it('waits for a saved draft and sends no audience until one is chosen', () => {
    gql.checks.mockReturnValue({ data: undefined, loading: false, refetch: gql.refetch });
    const { result } = renderHook(() => useQualityChecks(null, ''));
    expect(gql.checks).toHaveBeenCalledWith({
      variables: { id: '', audienceListId: null },
      skip: true,
      fetchPolicy: 'network-only',
    });
    expect(result.current.report).toBeNull();
  });

  it('reports a query error', () => {
    gql.checks.mockReturnValue({
      data: undefined,
      loading: false,
      error: new Error('Server down'),
      refetch: gql.refetch,
    });
    expect(renderHook(() => useQualityChecks('campaign-1', '')).result.current.error).toBe(
      'Server down',
    );
  });

  it('runs the checks again on demand', () => {
    const { result } = renderHook(() => useQualityChecks('campaign-1', 'audience-1'));
    act(() => result.current.run());
    expect(gql.refetch).toHaveBeenCalledTimes(1);
    expect(result.current.error).toBeNull();
  });

  it('says when a re-run fails, and clears it on the next run', async () => {
    gql.refetch.mockRejectedValueOnce(new Error('Timed out'));
    const { result } = renderHook(() => useQualityChecks('campaign-1', 'audience-1'));
    act(() => result.current.run());
    await waitFor(() => expect(result.current.error).toBe('Timed out'));
    act(() => result.current.run());
    expect(result.current.error).toBeNull();
  });
});
