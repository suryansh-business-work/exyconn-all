import { afterEach, describe, expect, it, vi } from 'vitest';
// Loaded once up front so each test's fresh import re-runs the module without transforming it again.
import '@/config/env';

async function loadEnv() {
  vi.resetModules();
  return (await import('@/config/env')).env;
}

afterEach(() => {
  vi.unstubAllEnvs();
});

describe('env', () => {
  it('falls back to local development values when nothing is set at build time', async () => {
    vi.stubEnv('VITE_GRAPHQL_URL', undefined);
    vi.stubEnv('VITE_PORTAL_APP', undefined);
    vi.stubEnv('VITE_PORTAL_DOMAIN', undefined);
    vi.stubEnv('VITE_WEBSITE_ORIGIN', undefined);
    const env = await loadEnv();
    expect(env.graphqlUrl).toBe('http://localhost:1002/graphql');
    expect(env.portalApp).toBe('hub');
    expect(env.portalDomain).toBe('');
    expect(env.websiteOrigin).toBe('');
  });

  it('reads the build-time values each app sets', async () => {
    vi.stubEnv('VITE_GRAPHQL_URL', 'https://api.example.test/graphql');
    vi.stubEnv('VITE_PORTAL_APP', 'finance');
    vi.stubEnv('VITE_PORTAL_DOMAIN', 'example.test');
    vi.stubEnv('VITE_WEBSITE_ORIGIN', 'http://localhost:4321');
    const env = await loadEnv();
    expect(env.graphqlUrl).toBe('https://api.example.test/graphql');
    expect(env.portalApp).toBe('finance');
    expect(env.portalDomain).toBe('example.test');
    expect(env.websiteOrigin).toBe('http://localhost:4321');
  });

  it('is frozen, so no module can rewrite the configuration', async () => {
    const env = await loadEnv();
    expect(Object.isFrozen(env)).toBe(true);
    expect(env.logoAlt).toBe('Exyconn');
  });
});
