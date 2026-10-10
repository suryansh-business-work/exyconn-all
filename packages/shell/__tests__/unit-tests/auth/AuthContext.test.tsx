import { describe, expect, it, vi } from 'vitest';
import { render, renderHook, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ApolloClient } from '@apollo/client';
import { MockedProvider } from '@apollo/client/testing/react';
import type { MockLink } from '@apollo/client/testing';
import { AuthProvider, useAuth, type AuthUser } from '@/auth/AuthContext';
import { portalLogger } from '@/logging/portalLogger';
import { tokenStore } from '@/auth/tokenStore';
import { userStore } from '@/auth/userStore';
import { MeDocument } from '@/graphql/generated';
import { makeSessionToken, makeUser, seedSession } from '../test-utils';

/** A full `me` answer for the Me query, as the API returns it. */
function meResult(user: AuthUser) {
  return {
    data: {
      me: {
        __typename: 'User',
        id: user.id,
        name: user.name,
        email: user.email,
        roles: user.roles,
        avatarUrl: null,
        timezone: null,
        locale: null,
        organizationId: user.organizationId ?? null,
        department: null,
        designation: null,
        brief: null,
        phone: null,
        socialLinks: null,
        lastActiveAt: null,
        isOnline: true,
      },
    },
  };
}

/** The session a sign-in in these tests hands over. */
const FRESH_SESSION = makeSessionToken();

function Probe() {
  const { user, loading, signIn, signOut, updateUser } = useAuth();
  return (
    <div>
      <p>user: {user ? user.name : 'none'}</p>
      <p>loading: {String(loading)}</p>
      <button type="button" onClick={() => signIn(FRESH_SESSION, makeUser({ name: 'Ravi' }))}>
        sign in
      </button>
      <button type="button" onClick={signOut}>
        sign out
      </button>
      <button type="button" onClick={() => updateUser({ name: 'Asha R.' })}>
        rename
      </button>
    </div>
  );
}

function renderAuth(mocks: ReadonlyArray<MockLink.MockedResponse> = []) {
  return render(
    <MockedProvider mocks={mocks}>
      <AuthProvider>
        <Probe />
      </AuthProvider>
    </MockedProvider>,
  );
}

describe('AuthProvider start-up', () => {
  it('drops a cached user that has no session token behind it', async () => {
    userStore.set(makeUser());
    renderAuth();

    expect(await screen.findByText('loading: false')).toBeInTheDocument();
    expect(screen.getByText('user: none')).toBeInTheDocument();
    expect(userStore.get()).toBeNull();
  });

  it('renders the cached user at once and refreshes it from the server', async () => {
    seedSession(makeUser());
    renderAuth([
      { request: { query: MeDocument }, result: meResult(makeUser({ name: 'Asha Rao-Iyer' })) },
    ]);

    expect(screen.getByText('user: Asha Rao')).toBeInTheDocument();
    expect(screen.getByText('loading: false')).toBeInTheDocument();
    expect(await screen.findByText('user: Asha Rao-Iyer')).toBeInTheDocument();
    expect(userStore.get()?.name).toBe('Asha Rao-Iyer');
  });

  it('waits for the server when a token exists but no user was cached', async () => {
    tokenStore.set(makeSessionToken());
    renderAuth([{ request: { query: MeDocument }, result: meResult(makeUser()) }]);

    expect(screen.getByText('loading: true')).toBeInTheDocument();
    expect(await screen.findByText('user: Asha Rao')).toBeInTheDocument();
    expect(screen.getByText('loading: false')).toBeInTheDocument();
  });

  it('keeps the cached session through a network failure', async () => {
    seedSession(makeUser());
    renderAuth([{ request: { query: MeDocument }, error: new Error('offline') }]);

    await waitFor(() => expect(screen.getByText('loading: false')).toBeInTheDocument());
    expect(screen.getByText('user: Asha Rao')).toBeInTheDocument();
    expect(userStore.get()).not.toBeNull();
  });

  it('keeps the session when the server returns no user but the token is still held', async () => {
    seedSession(makeUser());
    const answer = vi.fn(() => ({ data: { me: null } }));
    const tokenReads = vi.spyOn(tokenStore, 'get');
    renderAuth([{ request: { query: MeDocument }, result: answer }]);

    // The provider re-reads the token once the empty answer lands, and finds it still there.
    await waitFor(() => {
      const answeredAt = answer.mock.invocationCallOrder[0];
      expect(tokenReads.mock.invocationCallOrder.some((at) => at > answeredAt)).toBe(true);
    });
    expect(screen.getByText('user: Asha Rao')).toBeInTheDocument();
    expect(userStore.get()?.name).toBe('Asha Rao');
    tokenReads.mockRestore();
  });

  it('signs out when the server rejected the token and it has been dropped', async () => {
    seedSession(makeUser());
    renderAuth([
      {
        request: { query: MeDocument },
        result: () => {
          tokenStore.clear();
          return { data: { me: null } };
        },
      },
    ]);

    expect(await screen.findByText('user: none')).toBeInTheDocument();
    expect(userStore.get()).toBeNull();
  });
});

describe('AuthProvider actions', () => {
  it('signs in, renames and signs out', async () => {
    const user = userEvent.setup();
    renderAuth();
    await screen.findByText('loading: false');

    await user.click(screen.getByRole('button', { name: 'sign in' }));
    expect(screen.getByText('user: Ravi')).toBeInTheDocument();
    expect(tokenStore.get()).toBe(FRESH_SESSION);
    expect(userStore.get()?.name).toBe('Ravi');

    await user.click(screen.getByRole('button', { name: 'rename' }));
    expect(screen.getByText('user: Asha R.')).toBeInTheDocument();
    expect(userStore.get()?.name).toBe('Asha R.');

    await user.click(screen.getByRole('button', { name: 'sign out' }));
    expect(screen.getByText('user: none')).toBeInTheDocument();
    expect(tokenStore.get()).toBeNull();
    expect(userStore.get()).toBeNull();
  });

  it('still signs out and logs a warning when the cache cannot be cleared', async () => {
    const user = userEvent.setup();
    const failure = new Error('store busy');
    vi.spyOn(ApolloClient.prototype, 'clearStore').mockRejectedValue(failure);
    const warn = vi.spyOn(portalLogger, 'warn').mockImplementation(() => undefined);
    renderAuth();
    await screen.findByText('loading: false');
    await user.click(screen.getByRole('button', { name: 'sign in' }));

    await user.click(screen.getByRole('button', { name: 'sign out' }));

    expect(screen.getByText('user: none')).toBeInTheDocument();
    await waitFor(() =>
      expect(warn).toHaveBeenCalledWith('Could not clear the cache on sign-out', failure),
    );
    vi.restoreAllMocks();
  });

  it('ignores a profile update while nobody is signed in', async () => {
    const user = userEvent.setup();
    renderAuth();
    await screen.findByText('loading: false');

    await user.click(screen.getByRole('button', { name: 'rename' }));

    expect(screen.getByText('user: none')).toBeInTheDocument();
    expect(userStore.get()).toBeNull();
  });
});

describe('useAuth', () => {
  it('refuses to run outside an AuthProvider', () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    expect(() => renderHook(() => useAuth())).toThrow(
      'useAuth must be used within an AuthProvider',
    );
    vi.restoreAllMocks();
  });
});
