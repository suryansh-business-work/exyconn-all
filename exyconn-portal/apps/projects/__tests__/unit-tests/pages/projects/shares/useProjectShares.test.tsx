import { beforeEach, describe, expect, it, vi } from 'vitest';
import { act } from '@testing-library/react';
import { useProjectShares } from '../../../../../src/pages/projects/shares';
import { renderHookWithProviders } from '../../../test-utils';
import { shareFixture } from '../projects-fixtures';

const gql = vi.hoisted(() => ({
  query: vi.fn(),
  refetch: vi.fn(),
  revoke: vi.fn(),
  confirm: vi.fn(),
  notify: vi.fn(),
  writeText: vi.fn(),
}));

vi.mock('@exyconn/shell/graphql/generated', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@exyconn/shell/graphql/generated')>()),
  useProjectSharesQuery: (options: unknown) => gql.query(options),
  useRevokeProjectShareMutation: () => [gql.revoke],
}));

vi.mock('@exyconn/shell/components/feedback/ConfirmProvider', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@exyconn/shell/components/feedback/ConfirmProvider')>()),
  useConfirm: () => gql.confirm,
}));

vi.mock('@exyconn/shell/components/feedback/NotificationProvider', async (importOriginal) => ({
  ...(await importOriginal<
    typeof import('@exyconn/shell/components/feedback/NotificationProvider')
  >()),
  useNotify: () => gql.notify,
}));

const LINK = 'https://portal.exyconn.com/share/abc';

describe('useProjectShares', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    gql.refetch.mockResolvedValue({});
    gql.revoke.mockResolvedValue({ data: { revokeProjectShare: true } });
    gql.confirm.mockResolvedValue(true);
    gql.writeText.mockResolvedValue(undefined);
    gql.query.mockReturnValue({
      data: { projectShares: [shareFixture()] },
      loading: false,
      refetch: gql.refetch,
    });
    Object.defineProperty(globalThis.navigator, 'clipboard', {
      value: { writeText: gql.writeText },
      configurable: true,
    });
  });

  it('lists the project links and asks for them by project', () => {
    const { result } = renderHookWithProviders(() => useProjectShares('proj-1'));

    expect(result.current.shares).toEqual([shareFixture()]);
    expect(result.current.loading).toBe(false);
    expect(result.current.newUrl).toBe('');
    expect(gql.query).toHaveBeenCalledWith({
      variables: { projectId: 'proj-1' },
      skip: false,
      fetchPolicy: 'cache-and-network',
    });
  });

  it('is loading only before the first answer, and skips without a project', () => {
    gql.query.mockReturnValue({ data: undefined, loading: true, refetch: gql.refetch });
    const { result } = renderHookWithProviders(() => useProjectShares(''));

    expect(result.current.loading).toBe(true);
    expect(result.current.shares).toEqual([]);
    expect(gql.query).toHaveBeenCalledWith(expect.objectContaining({ skip: true }));
  });

  it('is not loading while it refreshes a list it already has', () => {
    gql.query.mockReturnValue({ data: { projectShares: [] }, loading: true, refetch: gql.refetch });
    const { result } = renderHookWithProviders(() => useProjectShares('proj-1'));

    expect(result.current.loading).toBe(false);
  });

  it('holds a new link once, reloads the list, and forgets it on request', async () => {
    const { result } = renderHookWithProviders(() => useProjectShares('proj-1'));

    await act(() => result.current.onCreated(LINK));
    expect(result.current.newUrl).toBe(LINK);
    expect(gql.refetch).toHaveBeenCalledTimes(1);

    act(() => result.current.forget());
    expect(result.current.newUrl).toBe('');
  });

  it('copies the new link to the clipboard and says so', async () => {
    const { result } = renderHookWithProviders(() => useProjectShares('proj-1'));
    await act(() => result.current.onCreated(LINK));

    await act(() => result.current.copyNewUrl());

    expect(gql.writeText).toHaveBeenCalledWith(LINK);
    expect(gql.notify).toHaveBeenCalledWith('Link copied');
  });

  it('reports a clipboard the browser refused, with its reason or a plain fallback', async () => {
    const { result } = renderHookWithProviders(() => useProjectShares('proj-1'));

    gql.writeText.mockRejectedValueOnce(new Error('Permission denied'));
    await act(() => result.current.copyNewUrl());
    expect(gql.notify).toHaveBeenLastCalledWith('Permission denied', 'error');

    gql.writeText.mockRejectedValueOnce('blocked');
    await act(() => result.current.copyNewUrl());
    expect(gql.notify).toHaveBeenLastCalledWith('Could not copy the link', 'error');
  });

  it('revokes a link after confirming, then reloads', async () => {
    const { result } = renderHookWithProviders(() => useProjectShares('proj-1'));

    await act(() => result.current.revoke(shareFixture({ id: 'share-9' })));

    expect(gql.confirm).toHaveBeenCalledWith({
      message: 'Revoke "{label}"? Anyone holding it loses access at once.',
      messageValues: { label: 'Client review' },
      confirmText: 'Revoke',
    });
    expect(gql.revoke).toHaveBeenCalledWith({ variables: { id: 'share-9' } });
    expect(gql.notify).toHaveBeenCalledWith('Link revoked');
    expect(gql.refetch).toHaveBeenCalledTimes(1);
  });

  it('names an untitled link generically and does nothing when the person backs out', async () => {
    gql.confirm.mockResolvedValueOnce(false);
    const { result } = renderHookWithProviders(() => useProjectShares('proj-1'));

    await act(() => result.current.revoke(shareFixture({ label: '' })));

    expect(gql.confirm).toHaveBeenCalledWith(
      expect.objectContaining({ messageValues: { label: 'this link' } }),
    );
    expect(gql.revoke).not.toHaveBeenCalled();
    expect(gql.refetch).not.toHaveBeenCalled();
  });

  it('says why a revoke failed and does not reload', async () => {
    const { result } = renderHookWithProviders(() => useProjectShares('proj-1'));

    gql.revoke.mockRejectedValueOnce(new Error('Share not found'));
    await act(() => result.current.revoke(shareFixture()));
    expect(gql.notify).toHaveBeenLastCalledWith('Share not found', 'error');

    gql.revoke.mockRejectedValueOnce(42);
    await act(() => result.current.revoke(shareFixture()));
    expect(gql.notify).toHaveBeenLastCalledWith('Could not revoke the link', 'error');
    expect(gql.refetch).not.toHaveBeenCalled();
  });
});
