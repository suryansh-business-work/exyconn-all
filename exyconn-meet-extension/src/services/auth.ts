import { isRecord } from '../storage/area';
import type { TokenStore } from '../storage/tokens';
import { ApiError, fetchWithTimeout, readJson, type FetchLike } from './http';

/** A token this close to expiry is treated as expired, so it never dies mid-request. */
const EXPIRY_SKEW_MS = 30_000;

/** OAuth errors that mean the refresh token is gone for good (RFC 6749 §5.2). */
const TERMINAL_ERRORS = new Set(['invalid_grant', 'invalid_client', 'unauthorized_client']);

export interface AuthOptions {
  apiUrl: string;
  fetchImpl: FetchLike;
  store: TokenStore;
  extensionId: string;
  extensionVersion: string;
  now: () => number;
}

export interface CodeExchange {
  code: string;
  verifier: string;
  redirectUri: string;
  deviceLabel: string;
}

interface TokenResponse {
  access_token: string;
  expires_in: number;
  refresh_token: string;
  refresh_expires_in: number;
}

function parseTokenResponse(body: unknown): TokenResponse | null {
  if (
    !isRecord(body) ||
    typeof body.access_token !== 'string' ||
    typeof body.expires_in !== 'number' ||
    typeof body.refresh_token !== 'string' ||
    typeof body.refresh_expires_in !== 'number'
  ) {
    return null;
  }
  return {
    access_token: body.access_token,
    expires_in: body.expires_in,
    refresh_token: body.refresh_token,
    refresh_expires_in: body.refresh_expires_in,
  };
}

function oauthError(body: unknown): string {
  return isRecord(body) && typeof body.error === 'string' ? body.error : 'server_error';
}

/**
 * The extension's sign-in: the authorization-code exchange, the access token and its
 * refresh, and sign-out. Refresh tokens rotate on every use, so refreshes are single-flight —
 * two callers needing a token at once share one exchange instead of spending the same refresh
 * token twice (the second would fail and sign the user out).
 */
export function createAuth(options: AuthOptions) {
  const { store, now } = options;
  let refreshing: Promise<string | null> | null = null;

  async function postToken(payload: Record<string, unknown>): Promise<TokenResponse> {
    const response = await fetchWithTimeout(
      options.fetchImpl,
      `${options.apiUrl}/meet-assistant/auth/token`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...payload,
          extension_id: options.extensionId,
          extension_version: options.extensionVersion,
        }),
      },
    );
    const body = await readJson(response);
    if (!response.ok) {
      throw new ApiError('The sign-in was refused', oauthError(body), response.status);
    }
    const tokens = parseTokenResponse(body);
    if (tokens === null) {
      throw new ApiError('The sign-in answer was malformed', 'invalid_response', response.status);
    }
    return tokens;
  }

  async function keep(tokens: TokenResponse): Promise<string> {
    const at = now();
    await store.save(
      { token: tokens.access_token, expiresAt: at + tokens.expires_in * 1000 },
      { token: tokens.refresh_token, expiresAt: at + tokens.refresh_expires_in * 1000 },
    );
    return tokens.access_token;
  }

  const fresh = (expiresAt: number): boolean => expiresAt - EXPIRY_SKEW_MS > now();

  async function runRefresh(): Promise<string | null> {
    const stored = await store.readRefresh();
    if (stored === null || !fresh(stored.expiresAt)) {
      await store.clear();
      return null;
    }
    try {
      return await keep(
        await postToken({ grant_type: 'refresh_token', refresh_token: stored.token }),
      );
    } catch (error) {
      if (error instanceof ApiError && TERMINAL_ERRORS.has(error.code)) {
        await store.clear();
        return null;
      }
      throw error;
    }
  }

  function refresh(): Promise<string | null> {
    refreshing ??= runRefresh().finally(() => {
      refreshing = null;
    });
    return refreshing;
  }

  return {
    async exchangeCode(exchange: CodeExchange): Promise<void> {
      await keep(
        await postToken({
          grant_type: 'authorization_code',
          code: exchange.code,
          code_verifier: exchange.verifier,
          redirect_uri: exchange.redirectUri,
          device_label: exchange.deviceLabel,
        }),
      );
    },

    /** A usable access token, refreshing it first if needed; null when signed out. */
    async getAccessToken(): Promise<string | null> {
      const access = await store.readAccess();
      if (access !== null && fresh(access.expiresAt)) {
        return access.token;
      }
      return refresh();
    },

    refresh,

    async isSignedIn(): Promise<boolean> {
      const stored = await store.readRefresh();
      return stored !== null && fresh(stored.expiresAt);
    },

    /**
     * Revokes the refresh token on the server, then forgets both tokens. Local sign-out
     * always happens; the result says whether the server confirmed the revocation.
     */
    async signOut(): Promise<boolean> {
      const stored = await store.readRefresh();
      await store.clear();
      if (stored === null) {
        return true;
      }
      try {
        const response = await fetchWithTimeout(
          options.fetchImpl,
          `${options.apiUrl}/meet-assistant/auth/revoke`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ refresh_token: stored.token }),
          },
        );
        return response.ok;
      } catch {
        return false;
      }
    },
  };
}

export type Auth = ReturnType<typeof createAuth>;
