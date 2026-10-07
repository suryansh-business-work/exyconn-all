import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, waitFor } from '@testing-library/react';
import { SocialApp } from '@exyconn/shell/graphql/generated';
import { portalLogger } from '@exyconn/shell/logging/portalLogger';
import { useSocialAccounts } from '../../../../src/pages/social/useSocialAccounts';
import { renderHookWithProviders } from '../../test-utils';
import { accountRow, providerRow } from '../../fixtures';

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

const ACCOUNT = accountRow();
const render = () => renderHookWithProviders(() => useSocialAccounts());

describe('useSocialAccounts', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    gql.refetch.mockResolvedValue({});
    gql.providers.mockReturnValue({ data: { socialAppStatuses: [providerRow()] }, loading: false });
    gql.accounts.mockReturnValue({
      data: { socialAccounts: [ACCOUNT] },
      loading: false,
      refetch: gql.refetch,
    });
    gql.confirm.mockResolvedValue(true);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('hands over the providers and the connected accounts', () => {
    const { result } = render();

    expect(result.current.providers).toEqual([providerRow()]);
    expect(result.current.accounts).toEqual([ACCOUNT]);
    expect(result.current.loading).toBe(false);
    expect(result.current.refetch).toBe(gql.refetch);
  });

  it('is empty and loading until either list arrives', () => {
    gql.providers.mockReturnValue({ data: undefined, loading: true });
    gql.accounts.mockReturnValue({ data: undefined, loading: false, refetch: gql.refetch });
    const { result } = render();

    expect(result.current.providers).toEqual([]);
    expect(result.current.accounts).toEqual([]);
    expect(result.current.loading).toBe(true);
  });

  it("sends the browser to the provider's consent page", async () => {
    const assign = vi.fn();
    vi.stubGlobal('location', { assign });
    gql.startConnect.mockResolvedValue({
      data: { startSocialConnect: 'https://meta.example/consent' },
    });
    const { result } = render();

    await act(() => result.current.connect(SocialApp.Meta));

    expect(gql.startConnect).toHaveBeenCalledWith({ variables: { app: SocialApp.Meta } });
    expect(assign).toHaveBeenCalledWith('https://meta.example/consent');
    expect(result.current.connecting).toBe(SocialApp.Meta);
  });

  it('stays put when the server hands back no consent page', async () => {
    const assign = vi.fn();
    vi.stubGlobal('location', { assign });
    gql.startConnect.mockResolvedValue({ data: null });
    const { result } = render();

    await act(() => result.current.connect(SocialApp.Meta));

    expect(assign).not.toHaveBeenCalled();
  });

  it('reports a connection that could not start and frees the button', async () => {
    gql.startConnect.mockRejectedValue('denied');
    const { result } = render();

    await act(() => result.current.connect(SocialApp.Meta));

    expect(gql.notify).toHaveBeenCalledWith('Could not start the connection', 'error');
    expect(result.current.connecting).toBeNull();
  });

  it('disconnects an account only after confirming, then reloads', async () => {
    gql.disconnect.mockResolvedValue({});
    const { result } = render();

    await act(() => result.current.disconnect(ACCOUNT));

    expect(gql.confirm).toHaveBeenCalledWith({
      message: 'Disconnect {name}? Posts already published stay where they are.',
      messageValues: { name: 'Acme' },
      confirmText: 'Disconnect',
    });
    expect(gql.disconnect).toHaveBeenCalledWith({ variables: { id: 'fb-1' } });
    expect(gql.notify).toHaveBeenCalledWith('Account disconnected');
    expect(gql.refetch).toHaveBeenCalledTimes(1);
  });

  it('leaves the account alone when the disconnect is cancelled', async () => {
    gql.confirm.mockResolvedValue(false);
    const { result } = render();

    await act(() => result.current.disconnect(ACCOUNT));

    expect(gql.disconnect).not.toHaveBeenCalled();
    expect(gql.notify).not.toHaveBeenCalled();
  });

  it('reports a disconnect that failed', async () => {
    gql.disconnect.mockRejectedValue(new Error('Still publishing'));
    const { result } = render();

    await act(() => result.current.disconnect(ACCOUNT));

    expect(gql.notify).toHaveBeenCalledWith('Still publishing', 'error');
    expect(gql.refetch).not.toHaveBeenCalled();
  });

  it('logs a reload that failed instead of throwing', async () => {
    gql.refetch.mockRejectedValue(new Error('offline'));
    const { result } = render();

    act(() => result.current.reload());

    await waitFor(() =>
      expect(portalLogger.warn).toHaveBeenCalledWith(
        'Could not reload accounts',
        expect.any(Error),
      ),
    );
  });
});
