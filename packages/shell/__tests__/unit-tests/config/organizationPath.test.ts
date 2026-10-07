import { afterEach, describe, expect, it, vi } from 'vitest';
import { organizationBasename, organizationSlugOf } from '@/config/organizationPath';

/** Loads the module as a page opened at `url` would: the company prefix is read at import. */
async function loadAt(url: string) {
  globalThis.history.replaceState(null, '', url);
  vi.resetModules();
  return import('@/config/organizationPath');
}

afterEach(() => {
  globalThis.history.replaceState(null, '', '/');
});

describe('organizationSlugOf', () => {
  it('reads the company handle after /organization/', () => {
    expect(organizationSlugOf('/organization/acme/hr/leave')).toBe('acme');
    expect(organizationSlugOf('/organization/acme')).toBe('acme');
  });

  it('decodes an encoded handle', () => {
    expect(organizationSlugOf('/organization/acme%20labs/hr')).toBe('acme labs');
  });

  it('answers null when the path names no company', () => {
    expect(organizationSlugOf('/hr/leave')).toBeNull();
    expect(organizationSlugOf('/organization')).toBeNull();
    expect(organizationSlugOf('/organization/')).toBeNull();
    expect(organizationSlugOf('/')).toBeNull();
  });
});

describe('organizationBasename', () => {
  it('is empty when no company is named', () => {
    expect(organizationBasename(null)).toBe('');
    expect(organizationBasename('')).toBe('');
  });

  it('encodes the handle into the prefix', () => {
    expect(organizationBasename('acme')).toBe('/organization/acme');
    expect(organizationBasename('acme labs')).toBe('/organization/acme%20labs');
  });

  it('round-trips with organizationSlugOf', () => {
    expect(organizationSlugOf(`${organizationBasename('a/b c')}/hr`)).toBe('a/b c');
  });
});

describe('a page loaded for a company', () => {
  it('takes the company and router basename from the address', async () => {
    const mod = await loadAt('/organization/acme/hr/leave?tab=pending#top');
    expect(mod.CURRENT_ORGANIZATION_SLUG).toBe('acme');
    expect(mod.ORGANIZATION_BASENAME).toBe('/organization/acme');
  });

  it('knows where it is inside the app, query and hash included', async () => {
    const mod = await loadAt('/organization/acme/hr/leave?tab=pending#top');
    expect(mod.pathInApp()).toBe('/hr/leave?tab=pending#top');
  });

  it('treats the bare company address as the app root', async () => {
    const mod = await loadAt('/organization/acme');
    expect(mod.pathInApp()).toBe('/');
  });

  it('points the same place at another company', async () => {
    const mod = await loadAt('/organization/acme/hr/leave?tab=pending');
    expect(mod.organizationLocation('beta co')).toBe(
      '/organization/beta%20co/hr/leave?tab=pending',
    );
  });
});

describe('a page loaded without a company', () => {
  it('has no prefix, so the whole path is the app path', async () => {
    const mod = await loadAt('/hr/leave?x=1');
    expect(mod.CURRENT_ORGANIZATION_SLUG).toBeNull();
    expect(mod.ORGANIZATION_BASENAME).toBe('');
    expect(mod.pathInApp()).toBe('/hr/leave?x=1');
    expect(mod.organizationLocation('acme')).toBe('/organization/acme/hr/leave?x=1');
  });
});
