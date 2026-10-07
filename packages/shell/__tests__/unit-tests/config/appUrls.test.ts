import { afterEach, describe, expect, it, vi } from 'vitest';
// Loaded once up front so each test's fresh import re-runs the module without transforming it again.
import '@/config/apps';

/** Loads the registry the way an app built with these values would see it. */
async function loadApps({
  app,
  domain,
  url = '/',
}: Readonly<{ app: string; domain?: string; url?: string }>) {
  vi.stubEnv('VITE_PORTAL_APP', app);
  vi.stubEnv('VITE_PORTAL_DOMAIN', domain);
  globalThis.history.replaceState(null, '', url);
  vi.resetModules();
  return import('@/config/apps');
}

afterEach(() => {
  vi.unstubAllEnvs();
  globalThis.history.replaceState(null, '', '/');
});

describe('appOrigin', () => {
  it('serves each app from its own localhost port in development', async () => {
    const { appOrigin } = await loadApps({ app: 'hub' });
    expect(appOrigin('admin')).toBe('http://localhost:4020');
    expect(appOrigin('hub')).toBe('http://localhost:4003');
  });

  it('serves each app from its own subdomain in production', async () => {
    const { appOrigin } = await loadApps({ app: 'hub', domain: 'example.test' });
    expect(appOrigin('admin')).toBe('https://admin.example.test');
    expect(appOrigin('hub')).toBe('https://portal.example.test');
  });
});

describe('appBaseUrl and HUB_URL', () => {
  it('add the company prefix the page was opened with', async () => {
    const apps = await loadApps({
      app: 'hr',
      domain: 'example.test',
      url: '/organization/acme/hr',
    });
    expect(apps.appBaseUrl('finance')).toBe('https://finance.example.test/organization/acme');
    expect(apps.HUB_URL).toBe('https://portal.example.test/organization/acme');
  });

  it('are the bare origin when no company is named', async () => {
    const apps = await loadApps({ app: 'hr' });
    expect(apps.appBaseUrl('finance')).toBe('http://localhost:4022');
    expect(apps.HUB_URL).toBe('http://localhost:4003');
  });
});

describe('appUrl', () => {
  it('keeps a link inside this app relative', async () => {
    const { appUrl } = await loadApps({ app: 'hr', domain: 'example.test' });
    expect(appUrl('hr', '/hr/leave')).toBe('/hr/leave');
  });

  it('makes a link into another app absolute', async () => {
    const { appUrl } = await loadApps({
      app: 'hr',
      domain: 'example.test',
      url: '/organization/acme',
    });
    expect(appUrl('finance', '/finance/invoices')).toBe(
      'https://finance.example.test/organization/acme/finance/invoices',
    );
  });
});
