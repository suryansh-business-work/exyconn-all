import { afterEach, describe, expect, it, vi } from 'vitest';

/** tracker/config reads the build's extras once, at import, so each case loads it afresh. */
async function loadWithExtra(extra: Record<string, unknown> | undefined, hasConfig = true) {
  vi.resetModules();
  vi.doMock('expo-constants', () => ({
    default: { expoConfig: hasConfig ? { extra } : null },
  }));
  return import('../../../src/tracker/config');
}

afterEach(() => {
  vi.doUnmock('expo-constants');
  vi.resetModules();
});

describe('tracker config', () => {
  it('reads the portal addresses baked into the build', async () => {
    const config = await import('../../../src/tracker/config');
    expect(config.PORTAL_GRAPHQL_URL).toBe('https://portal.example.test/graphql');
    expect(config.MY_DATA_URL).toBe('https://portal.example.test/me/tracker');
    expect(config.APP_SCHEME).toBe('exyconntracker');
  });

  it('refuses to start a build with no GraphQL address', async () => {
    await expect(loadWithExtra({ portalWebUrl: 'https://portal.example.test' })).rejects.toThrow(
      'This build has no portal address (extra.portalGraphqlUrl).',
    );
  });

  it('treats an empty or non-text address as missing', async () => {
    await expect(
      loadWithExtra({ portalGraphqlUrl: '', portalWebUrl: 'https://portal.example.test' }),
    ).rejects.toThrow('extra.portalGraphqlUrl');
    await expect(
      loadWithExtra({ portalGraphqlUrl: 'https://portal.example.test/graphql', portalWebUrl: 7 }),
    ).rejects.toThrow('extra.portalWebUrl');
  });

  it('refuses a build with no extras, or no Expo config at all', async () => {
    await expect(loadWithExtra(undefined)).rejects.toThrow('extra.portalGraphqlUrl');
    await expect(loadWithExtra(undefined, false)).rejects.toThrow('extra.portalGraphqlUrl');
  });
});
