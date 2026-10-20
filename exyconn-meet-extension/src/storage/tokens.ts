import { createSlot, isRecord, type KeyValueArea } from './area';

/** A token and the epoch millisecond it stops working. */
export interface StoredToken {
  token: string;
  expiresAt: number;
}

export interface TokenStore {
  readAccess(): Promise<StoredToken | null>;
  readRefresh(): Promise<StoredToken | null>;
  save(access: StoredToken, refresh: StoredToken): Promise<void>;
  clear(): Promise<void>;
}

function parseToken(raw: unknown): StoredToken | null {
  if (!isRecord(raw) || typeof raw.token !== 'string' || typeof raw.expiresAt !== 'number') {
    return null;
  }
  return { token: raw.token, expiresAt: raw.expiresAt };
}

/**
 * Where the extension keeps its sign-in. The access token lives in `storage.session` (memory
 * only, gone when the browser closes); the refresh token in `storage.local` so a restart
 * stays signed in. Both areas are restricted to trusted contexts by the worker at startup,
 * so the content script on meet.google.com cannot read either.
 */
export function createTokenStore(session: KeyValueArea, local: KeyValueArea): TokenStore {
  const access = createSlot(session, 'auth.access', parseToken);
  const refresh = createSlot(local, 'auth.refresh', parseToken);
  return {
    readAccess: () => access.read(),
    readRefresh: () => refresh.read(),
    async save(nextAccess, nextRefresh) {
      // Refresh first: a crash between the two writes then leaves a usable refresh token.
      await refresh.write(nextRefresh);
      await access.write(nextAccess);
    },
    async clear() {
      await access.clear();
      await refresh.clear();
    },
  };
}
