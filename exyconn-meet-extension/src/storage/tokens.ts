import { createSlot, isRecord, type KeyValueArea } from './area';

/** A token and the epoch millisecond it stops working. */
export interface StoredToken {
  token: string;
  expiresAt: number;
}

/** The refresh token, and whether it was remembered past this browser session. */
export interface StoredRefresh extends StoredToken {
  remembered: boolean;
}

export interface TokenStore {
  readAccess(): Promise<StoredToken | null>;
  readRefresh(): Promise<StoredRefresh | null>;
  save(access: StoredToken, refresh: StoredToken, remember: boolean): Promise<void>;
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
 * only, gone when the browser closes). With "Remember me" the refresh token goes to
 * `storage.local`, so a restart stays signed in; without it, to `storage.session`, so closing
 * the browser signs out. Both areas are restricted to trusted contexts by the worker at
 * startup, so the content script on meet.google.com cannot read either.
 */
export function createTokenStore(session: KeyValueArea, local: KeyValueArea): TokenStore {
  const access = createSlot(session, 'auth.access', parseToken);
  const remembered = createSlot(local, 'auth.refresh', parseToken);
  const browserOnly = createSlot(session, 'auth.refresh', parseToken);
  return {
    readAccess: () => access.read(),
    async readRefresh() {
      const kept = await remembered.read();
      if (kept !== null) {
        return { ...kept, remembered: true };
      }
      const brief = await browserOnly.read();
      return brief === null ? null : { ...brief, remembered: false };
    },
    async save(nextAccess, nextRefresh, remember) {
      // Refresh first: a crash between the writes then leaves a usable refresh token.
      const [keep, drop] = remember ? [remembered, browserOnly] : [browserOnly, remembered];
      await keep.write(nextRefresh);
      await drop.clear();
      await access.write(nextAccess);
    },
    async clear() {
      await access.clear();
      await remembered.clear();
      await browserOnly.clear();
    },
  };
}
