import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  useMySessionsQuery,
  useRevokeOtherSessionsMutation,
  useRevokeSessionMutation,
} from '@/graphql/generated';
import { SessionsPanel, deviceName } from '@/pages/Settings/SessionsPanel';
import { renderWithProviders } from '../../test-utils';
import { mutationTuple, queryResult } from '../hookMocks';

vi.mock('@/graphql/generated', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/graphql/generated')>()),
  useMySessionsQuery: vi.fn(),
  useRevokeSessionMutation: vi.fn(),
  useRevokeOtherSessionsMutation: vi.fn(),
}));

const CHROME_MAC = 'Mozilla/5.0 (Macintosh) AppleWebKit Chrome/120 Safari/537';
const FIREFOX_WIN = 'Mozilla/5.0 (Windows NT 10.0) Firefox/121';

const current = {
  id: 's-1',
  userAgent: CHROME_MAC,
  ip: '10.0.0.1',
  current: true,
  lastSeenAt: '2026-10-01T09:00:00.000Z',
};
const other = { ...current, id: 's-2', userAgent: FIREFOX_WIN, ip: '', current: false };

const revoke = vi.fn();
const revokeOthers = vi.fn();

function mockSessions(sessions: unknown[] | undefined, extras = {}) {
  const result = queryResult(sessions && { mySessions: sessions }, extras);
  vi.mocked(useMySessionsQuery).mockReturnValue(result);
  return result;
}

beforeEach(() => {
  revoke.mockReset().mockResolvedValue({ data: { revokeSession: true } });
  revokeOthers.mockReset().mockResolvedValue({ data: { revokeOtherSessions: 3 } });
  vi.mocked(useRevokeSessionMutation).mockReturnValue(mutationTuple(revoke) as never);
  vi.mocked(useRevokeOtherSessionsMutation).mockReturnValue(mutationTuple(revokeOthers) as never);
});

describe('deviceName', () => {
  it('names browser and platform together', () => {
    expect(deviceName(CHROME_MAC)).toBe('Chrome on macOS');
    expect(deviceName('Mozilla/5.0 (Windows) Chrome/1 Edg/2')).toBe('Edge on Windows');
    expect(deviceName('Mozilla/5.0 (Linux; Android 14) OPR/80')).toBe('Opera on Android');
  });

  it('falls back to whichever half it recognises', () => {
    expect(deviceName('Safari/605')).toBe('Safari');
    expect(deviceName('Mozilla/5.0 (iPad)')).toBe('iPad');
  });

  it('stays honest about an empty or unknown agent', () => {
    expect(deviceName('')).toBe('Unknown device');
    expect(deviceName('curl/8.0')).toBe('Unknown device');
  });
});

describe('SessionsPanel', () => {
  it('shows a progress bar while the first load is in flight', () => {
    mockSessions(undefined, { loading: true });
    renderWithProviders(<SessionsPanel />);
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Sign out everywhere else' })).toBeNull();
  });

  it('reports a failed load', () => {
    mockSessions(undefined, { error: new Error('Sessions are down') });
    renderWithProviders(<SessionsPanel />);
    expect(screen.getByText('Sessions are down')).toBeInTheDocument();
  });

  it('lists each session, marks this device and offers End only for the others', () => {
    mockSessions([current, other]);
    renderWithProviders(<SessionsPanel />);

    expect(screen.getByText('Chrome on macOS')).toBeInTheDocument();
    expect(screen.getByText('This device')).toBeInTheDocument();
    expect(screen.getByText(/^10\.0\.0\.1 · last used/)).toBeInTheDocument();
    expect(screen.getByText(/^unknown address · last used/)).toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: 'End' })).toHaveLength(1);
  });

  it('hides "Sign out everywhere else" when this is the only session', () => {
    mockSessions([current]);
    renderWithProviders(<SessionsPanel />);
    expect(screen.queryByRole('button', { name: 'Sign out everywhere else' })).toBeNull();
  });

  it('does nothing when ending a session is cancelled', async () => {
    mockSessions([current, other]);
    renderWithProviders(<SessionsPanel />);

    await userEvent.click(screen.getByRole('button', { name: 'End' }));
    const dialog = await screen.findByRole('dialog');
    expect(
      within(dialog).getByText('Signing out Firefox on Windows takes effect immediately.'),
    ).toBeInTheDocument();
    await userEvent.click(within(dialog).getByRole('button', { name: 'Cancel' }));

    expect(revoke).not.toHaveBeenCalled();
  });

  it('ends one session, reloads the list and says so', async () => {
    const result = mockSessions([current, other]);
    renderWithProviders(<SessionsPanel />);

    await userEvent.click(screen.getByRole('button', { name: 'End' }));
    await userEvent.click(await screen.findByRole('button', { name: 'End session' }));

    expect(await screen.findByText('That device has been signed out.')).toBeInTheDocument();
    expect(revoke).toHaveBeenCalledWith({ variables: { id: 's-2' } });
    expect(result.refetch).toHaveBeenCalledTimes(1);
  });

  it('reports a session that could not be ended', async () => {
    revoke.mockRejectedValueOnce(new Error('Already gone'));
    mockSessions([current, other]);
    renderWithProviders(<SessionsPanel />);

    await userEvent.click(screen.getByRole('button', { name: 'End' }));
    await userEvent.click(await screen.findByRole('button', { name: 'End session' }));

    expect(await screen.findByText('Already gone')).toBeInTheDocument();
  });

  it('signs out every other session and counts them', async () => {
    const result = mockSessions([current, other]);
    renderWithProviders(<SessionsPanel />);

    await userEvent.click(screen.getByRole('button', { name: 'Sign out everywhere else' }));
    await userEvent.click(await screen.findByRole('button', { name: 'Sign out others' }));

    expect(await screen.findByText('3 other session(s) ended.')).toBeInTheDocument();
    expect(result.refetch).toHaveBeenCalledTimes(1);
  });

  it('counts zero when the server returns no number', async () => {
    revokeOthers.mockResolvedValueOnce({ data: undefined });
    mockSessions([current, other]);
    renderWithProviders(<SessionsPanel />);

    await userEvent.click(screen.getByRole('button', { name: 'Sign out everywhere else' }));
    await userEvent.click(await screen.findByRole('button', { name: 'Sign out others' }));

    expect(await screen.findByText('0 other session(s) ended.')).toBeInTheDocument();
  });

  it('leaves the others signed in when cancelled', async () => {
    mockSessions([current, other]);
    renderWithProviders(<SessionsPanel />);

    await userEvent.click(screen.getByRole('button', { name: 'Sign out everywhere else' }));
    await userEvent.click(await screen.findByRole('button', { name: 'Cancel' }));
    expect(revokeOthers).not.toHaveBeenCalled();
  });

  it('reports other sessions that could not be ended', async () => {
    mockSessions([current, other]);
    renderWithProviders(<SessionsPanel />);
    revokeOthers.mockRejectedValueOnce('offline');
    await userEvent.click(screen.getByRole('button', { name: 'Sign out everywhere else' }));
    await userEvent.click(await screen.findByRole('button', { name: 'Sign out others' }));
    expect(await screen.findByText('Those sessions could not be ended.')).toBeInTheDocument();
  });
});
