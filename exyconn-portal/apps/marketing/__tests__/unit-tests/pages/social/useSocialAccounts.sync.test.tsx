import { beforeEach, describe, expect, it, vi } from 'vitest';
import { act } from '@testing-library/react';
import { useSocialAccounts } from '../../../../src/pages/social/useSocialAccounts';
import { renderHookWithProviders } from '../../test-utils';
import { accountRow } from '../../fixtures';

const gql = vi.hoisted(() => ({
  providers: vi.fn(),
  accounts: vi.fn(),
  refetch: vi.fn(),
  startConnect: vi.fn(),
  disconnect: vi.fn(),
  syncOne: vi.fn(),
  syncEvery: vi.fn(),
  notify: vi.fn(),
  confirm: vi.fn(),
}));

vi.mock('@exyconn/shell/graphql/generated', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@exyconn/shell/graphql/generated')>()),
  useSocialAppStatusesQuery: () => gql.providers(),
  useSocialAccountsQuery: () => gql.accounts(),
  useStartSocialConnectMutation: () => [gql.startConnect],
  useDisconnectSocialAccountMutation: () => [gql.disconnect],
  useSyncSocialAccountMutation: () => [gql.syncOne],
  useSyncAllSocialAccountsMutation: () => [gql.syncEvery],
}));
vi.mock('@exyconn/shell/components/feedback/NotificationProvider', async (importOriginal) => ({
  ...(await importOriginal<
    typeof import('@exyconn/shell/components/feedback/NotificationProvider')
  >()),
  useNotify: () => gql.notify,
}));
vi.mock('@exyconn/shell/components/feedback/ConfirmProvider', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@exyconn/shell/components/feedback/ConfirmProvider')>()),
  useConfirm: () => gql.confirm,
}));
vi.mock('@exyconn/shell/logging/portalLogger', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@exyconn/shell/logging/portalLogger')>()),
  portalLogger: { error: vi.fn(), warn: vi.fn(), info: vi.fn() },
}));

const render = () => renderHookWithProviders(() => useSocialAccounts());
const result = (accountId: string, synced: number, error = '') => ({ accountId, synced, error });

describe('useSocialAccounts sync', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    gql.refetch.mockResolvedValue({});
    gql.providers.mockReturnValue({ data: undefined, loading: false });
    gql.accounts.mockReturnValue({
      data: { socialAccounts: [accountRow()] },
      loading: false,
      refetch: gql.refetch,
    });
  });

  it('reads one account now, reports the posts it found and reloads', async () => {
    gql.syncOne.mockResolvedValue({ data: { syncSocialAccount: result('fb-1', 3) } });
    const { result: hook } = render();

    await act(() => hook.current.sync('fb-1'));

    expect(gql.syncOne).toHaveBeenCalledWith({ variables: { id: 'fb-1' } });
    expect(gql.notify).toHaveBeenCalledWith('Synced {count} post(s)', 'success', { count: 3 });
    expect(gql.refetch).toHaveBeenCalledTimes(1);
    expect(hook.current.syncing).toBeNull();
  });

  it('marks the sync as running until it settles', async () => {
    let finish: (value: unknown) => void = () => undefined;
    gql.syncEvery.mockReturnValue(
      new Promise((resolve) => {
        finish = resolve;
      }),
    );
    const { result: hook } = render();

    let running: Promise<void> = Promise.resolve();
    act(() => {
      running = hook.current.sync();
    });
    expect(hook.current.syncing).toBe('all');

    await act(async () => {
      finish({ data: { syncAllSocialAccounts: [] } });
      await running;
    });
    expect(hook.current.syncing).toBeNull();
  });

  it('adds up every account when syncing them all', async () => {
    gql.syncEvery.mockResolvedValue({
      data: { syncAllSocialAccounts: [result('fb-1', 2), result('x-1', 5)] },
    });
    const { result: hook } = render();

    await act(() => hook.current.sync());

    expect(gql.notify).toHaveBeenCalledWith('Synced {count} post(s)', 'success', { count: 7 });
  });

  it("reports each network's own reason when accounts fail", async () => {
    gql.syncEvery.mockResolvedValue({
      data: {
        syncAllSocialAccounts: [
          result('fb-1', 0, 'Facebook token expired.'),
          result('x-1', 4),
          result('li-1', 0, 'LinkedIn is rate limiting.'),
        ],
      },
    });
    const { result: hook } = render();

    await act(() => hook.current.sync());

    expect(gql.notify).toHaveBeenCalledWith(
      'Facebook token expired. LinkedIn is rate limiting.',
      'error',
    );
    expect(gql.refetch).toHaveBeenCalledTimes(1);
  });

  it('counts nothing when the server answers with no results', async () => {
    gql.syncEvery.mockResolvedValue({ data: null });
    gql.syncOne.mockResolvedValue({ data: undefined });
    const { result: hook } = render();

    await act(() => hook.current.sync());
    await act(() => hook.current.sync('fb-1'));

    expect(gql.notify).toHaveBeenNthCalledWith(1, 'Synced {count} post(s)', 'success', {
      count: 0,
    });
    expect(gql.notify).toHaveBeenNthCalledWith(2, 'Synced {count} post(s)', 'success', {
      count: 0,
    });
  });

  it('reports a sync that failed outright and frees the button', async () => {
    gql.syncOne.mockRejectedValue(new Error('Network unreachable'));
    gql.syncEvery.mockRejectedValue('timeout');
    const { result: hook } = render();

    await act(() => hook.current.sync('fb-1'));
    await act(() => hook.current.sync());

    expect(gql.notify).toHaveBeenCalledWith('Network unreachable', 'error');
    expect(gql.notify).toHaveBeenCalledWith('Could not sync', 'error');
    expect(gql.refetch).not.toHaveBeenCalled();
    expect(hook.current.syncing).toBeNull();
  });
});
