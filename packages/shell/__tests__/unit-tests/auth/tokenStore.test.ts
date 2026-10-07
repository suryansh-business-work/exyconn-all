import { afterEach, describe, expect, it, vi } from 'vitest';
import { env } from '@/config/env';
import { tokenStore } from '@/auth/tokenStore';
import { makeSessionToken } from '../test-utils';

const COOKIE_PREFIX = `${env.tokenStorageKey}=`;

function sessionCookie(): string | undefined {
  return document.cookie.split('; ').find((cookie) => cookie.startsWith(COOKIE_PREFIX));
}

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllEnvs();
  vi.resetModules();
});

describe('tokenStore on a dev host', () => {
  it('reads nothing when no session was ever stored', () => {
    expect(tokenStore.get()).toBeNull();
  });

  it('keeps the token in a cookie and reads it back decoded', () => {
    const token = `${makeSessionToken()} with spaces/and=signs`;
    tokenStore.set(token);

    expect(sessionCookie()).toBe(`${COOKIE_PREFIX}${encodeURIComponent(token)}`);
    expect(tokenStore.get()).toBe(token);
  });

  it('writes a host-only, non-secure cookie scoped to the whole site for a week', () => {
    const writes: string[] = [];
    vi.spyOn(Document.prototype, 'cookie', 'set').mockImplementation((value: string) => {
      writes.push(value);
    });
    tokenStore.set(makeSessionToken());

    expect(writes).toHaveLength(1);
    expect(writes[0]).toContain('; path=/; samesite=lax; max-age=604800');
    expect(writes[0]).not.toContain('domain=');
    expect(writes[0]).not.toContain('secure');
  });

  it('carries a pre-cookie localStorage session over into the cookie', () => {
    const token = makeSessionToken();
    localStorage.setItem(env.tokenStorageKey, token);

    expect(tokenStore.get()).toBe(token);
    expect(localStorage.getItem(env.tokenStorageKey)).toBeNull();
    expect(sessionCookie()).toBe(`${COOKIE_PREFIX}${token}`);
  });

  it('removes both the cookie and any legacy copy on clear', () => {
    tokenStore.set(makeSessionToken());
    localStorage.setItem(env.tokenStorageKey, makeSessionToken());

    tokenStore.clear();

    expect(sessionCookie()).toBeUndefined();
    expect(localStorage.getItem(env.tokenStorageKey)).toBeNull();
    expect(tokenStore.get()).toBeNull();
  });

  it('does not claim a parent domain the page is not on', async () => {
    vi.stubEnv('VITE_PORTAL_DOMAIN', 'exyconn.com');
    vi.resetModules();
    const { tokenStore: scoped } = await import('@/auth/tokenStore');
    const writes: string[] = [];
    vi.spyOn(Document.prototype, 'cookie', 'set').mockImplementation((value: string) => {
      writes.push(value);
    });

    scoped.set(makeSessionToken());

    expect(writes[0]).not.toContain('domain=');
  });
});
