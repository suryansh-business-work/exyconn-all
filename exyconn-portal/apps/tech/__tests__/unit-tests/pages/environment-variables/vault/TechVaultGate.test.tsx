import { beforeEach, describe, expect, it, vi } from 'vitest';
import { act, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TechVaultGate } from '../../../../../src/pages/environment-variables/vault/TechVaultGate';
import { renderWithProviders } from '../../../test-utils';

const gql = vi.hoisted(() => ({ status: vi.fn(), lock: vi.fn(), refetch: vi.fn() }));
const forget = vi.hoisted(() => vi.fn());

vi.mock('@exyconn/shell/graphql/generated', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@exyconn/shell/graphql/generated')>()),
  useTechVaultStatusQuery: gql.status,
  useLockTechVaultMutation: () => [gql.lock, { loading: false }],
}));
vi.mock('@exyconn/shell/auth/AuthContext', () => ({
  useAuth: () => ({ user: { email: 'tech@exyconn.com' } }),
}));
vi.mock('../../../../../src/pages/environment-variables/techSecretsCache', () => ({
  forgetTechSecrets: forget,
}));
vi.mock('../../../../../src/pages/environment-variables/vault/forms/unlock-vault', () => ({
  UnlockVaultForm: ({ email, onUnlocked }: Readonly<{ email: string; onUnlocked: () => void }>) => (
    <button type="button" onClick={onUnlocked}>{`Unlock as ${email || 'nobody'}`}</button>
  ),
}));

const session = (minutes: number) => ({
  id: 's1',
  reason: 'Rotating keys',
  expiresAt: new Date(Date.now() + minutes * 60_000).toISOString(),
});

function status(data: unknown, extra: Record<string, unknown> = {}) {
  gql.status.mockReturnValue({
    data,
    loading: false,
    error: undefined,
    refetch: gql.refetch,
    ...extra,
  });
}

const renderGate = () =>
  renderWithProviders(
    <TechVaultGate>
      <p>The credentials</p>
    </TechVaultGate>,
  );

beforeEach(() => {
  vi.clearAllMocks();
  gql.refetch.mockResolvedValue({});
  gql.lock.mockResolvedValue({});
});

describe('TechVaultGate', () => {
  it('shows the locked screen, not the page, until the vault is unlocked', async () => {
    status({ techVaultStatus: null });
    renderGate();

    expect(
      screen.getByRole('heading', { name: 'Environment Variables are locked' }),
    ).toBeInTheDocument();
    expect(screen.queryByText('The credentials')).toBeNull();
    await userEvent.click(screen.getByRole('button', { name: 'Unlock as tech@exyconn.com' }));
    expect(gql.refetch).toHaveBeenCalled();
  });

  it('shows the page with the time it locks itself, and locks on request', async () => {
    status({ techVaultStatus: session(12) });
    renderGate();

    expect(screen.getByText('The credentials')).toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent('12 min left');
    await userEvent.click(screen.getByRole('button', { name: 'Lock now' }));

    await waitFor(() => expect(gql.lock).toHaveBeenCalled());
    expect(forget).toHaveBeenCalled();
    expect(await screen.findByText('Environment Variables locked')).toBeInTheDocument();
  });

  it('says why it could not lock', async () => {
    status({ techVaultStatus: session(5) });
    gql.lock.mockRejectedValue(new Error('Network down'));
    renderGate();

    await userEvent.click(screen.getByRole('button', { name: 'Lock now' }));
    expect(await screen.findByText('Network down')).toBeInTheDocument();
  });

  it('locks itself and forgets every fetched value when the half hour runs out', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    try {
      status({ techVaultStatus: session(1) });
      renderGate();
      await act(async () => {
        await vi.advanceTimersByTimeAsync(61_000);
      });
      expect(forget).toHaveBeenCalled();
      expect(gql.refetch).toHaveBeenCalled();
      expect(screen.getByRole('status')).toHaveTextContent('0 min left');
    } finally {
      vi.useRealTimers();
    }
  });

  it('waits while it checks, and says why the check failed', () => {
    status(undefined, { loading: true });
    const { unmount } = renderGate();
    expect(screen.getByRole('status')).toHaveTextContent('Checking the lock');
    unmount();

    status(undefined, { error: new Error('Forbidden') });
    renderGate();
    expect(screen.getByText('Forbidden')).toBeInTheDocument();
  });
});
