import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  SITE_BASE,
  readLastSite,
  rememberSite,
  siteOrigin,
  sitePath,
  switchSitePath,
} from '../../../../../src/pages/cms/site/site-paths';

const envMock = vi.hoisted(() => ({ websiteOrigin: '', brandUrl: 'https://exyconn.com/' }));

vi.mock('@exyconn/shell/config/env', () => ({ env: envMock }));

const RECORD_ID = '64b7f0c2e4b0a1a2b3c4d5e6';

describe('site paths', () => {
  it('builds addresses under a site', () => {
    expect(SITE_BASE).toBe('/website/s');
    expect(sitePath('exyconn', 'pages')).toBe('/website/s/exyconn/pages');
    expect(sitePath('exyconn')).toBe('/website/s/exyconn');
  });

  it('keeps the section but drops a record of the old site when switching', () => {
    expect(switchSitePath(`/website/s/old/pages/${RECORD_ID}/edit`, 'new')).toBe(
      '/website/s/new/pages',
    );
    expect(switchSitePath('/website/s/old/newsletter/issues', 'new')).toBe(
      '/website/s/new/newsletter/issues',
    );
    expect(switchSitePath('/website/s/old', 'new')).toBe('/website/s/new');
  });

  it('opens the overview of the new site from an address outside any site', () => {
    expect(switchSitePath('/website', 'new')).toBe('/website/s/new');
  });
});

describe('the last site worked on', () => {
  const storage = Object.getPrototypeOf(globalThis.localStorage) as Storage;

  beforeEach(() => {
    globalThis.localStorage.clear();
  });
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('is remembered in the browser', () => {
    expect(readLastSite()).toBeNull();
    rememberSite('blog');
    expect(readLastSite()).toBe('blog');
  });

  it('reads as none when storage is blocked', () => {
    vi.spyOn(storage, 'getItem').mockImplementation(() => {
      throw new Error('blocked');
    });
    expect(readLastSite()).toBeNull();
  });

  it('is silently not kept when storage is blocked', () => {
    vi.spyOn(storage, 'setItem').mockImplementation(() => {
      throw new Error('blocked');
    });
    expect(() => rememberSite('blog')).not.toThrow();
  });
});

describe('siteOrigin', () => {
  afterEach(() => {
    envMock.websiteOrigin = '';
  });

  it('prefers the dev override, without trailing slashes', () => {
    envMock.websiteOrigin = 'http://localhost:4321//';
    expect(siteOrigin(['exyconn.com'])).toBe('http://localhost:4321');
  });

  it('uses the first domain over https', () => {
    expect(siteOrigin(['exyconn.com', 'www.exyconn.com'])).toBe('https://exyconn.com');
  });

  it('falls back to the brand origin for a site with no domain', () => {
    expect(siteOrigin([])).toBe('https://exyconn.com');
  });
});
