// @vitest-environment-options {"url": "https://hr.exyconn.com/"}
import { afterEach, describe, expect, it, vi } from 'vitest';
import { makeSessionToken } from '../test-utils';

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllEnvs();
  vi.resetModules();
});

describe('tokenStore on a portal subdomain over https', () => {
  it('shares the session cookie with every portal subdomain and marks it secure', async () => {
    vi.stubEnv('VITE_PORTAL_DOMAIN', 'exyconn.com');
    vi.resetModules();
    const { tokenStore } = await import('@/auth/tokenStore');
    const writes: string[] = [];
    vi.spyOn(Document.prototype, 'cookie', 'set').mockImplementation((value: string) => {
      writes.push(value);
    });

    tokenStore.set(makeSessionToken());
    tokenStore.clear();

    expect(writes).toHaveLength(2);
    expect(writes[0]).toContain(
      '; path=/; domain=.exyconn.com; samesite=lax; secure; max-age=604800',
    );
    expect(writes[1]).toContain('; domain=.exyconn.com; samesite=lax; secure; max-age=0');
  });
});
