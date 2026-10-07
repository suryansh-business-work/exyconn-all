import { afterEach, describe, expect, it, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import { FilterOp } from '@exyconn/shell/graphql/generated';
import {
  useCurrentSite,
  useCurrentSiteId,
  useSitePath,
  useSiteScope,
} from '../../../../../src/pages/cms/site';
import { renderHookInSite, siteFixture } from '../cms-helpers';

describe('useCurrentSite', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('hands over the site, the others and the reload', () => {
    const site = siteFixture();
    const other = siteFixture({ id: 'site-2', slug: 'blog', isDefault: false });
    const refetchSites = vi.fn().mockResolvedValue(undefined);
    const { result } = renderHookInSite(() => useCurrentSite(), {
      site,
      sites: [site, other],
      refetchSites,
    });

    expect(result.current.site).toBe(site);
    expect(result.current.sites).toEqual([site, other]);
    expect(result.current.refetchSites).toBe(refetchSites);
  });

  it('refuses to answer outside the site layout', () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    expect(() => renderHook(() => useCurrentSite())).toThrow(
      'useCurrentSite must be used under the site layout',
    );
  });
});

describe('useCurrentSiteId', () => {
  it('is the current site id under the layout', () => {
    const { result } = renderHookInSite(() => useCurrentSiteId(), {
      site: siteFixture({ id: 'site-9' }),
    });
    expect(result.current).toBe('site-9');
  });

  it('is undefined for a form mounted on its own', () => {
    const { result } = renderHook(() => useCurrentSiteId());
    expect(result.current).toBeUndefined();
  });
});

describe('useSitePath', () => {
  it('builds paths inside the current site', () => {
    const { result } = renderHookInSite(() => useSitePath(), {
      site: siteFixture({ slug: 'blog' }),
    });
    expect(result.current('pages')).toBe('/website/s/blog/pages');
    expect(result.current()).toBe('/website/s/blog');
  });
});

describe('useSiteScope', () => {
  it('filters to the site and lets the default site own records filed before sites', () => {
    const { result } = renderHookInSite(() => useSiteScope());

    expect(result.current.siteId).toBe('site-1');
    expect(result.current.filters).toEqual([
      { field: 'siteId', op: FilterOp.Equals, value: 'site-1' },
    ]);
    expect(result.current.owns({ siteId: 'site-1' })).toBe(true);
    expect(result.current.owns({ siteId: '' })).toBe(true);
    expect(result.current.owns({ siteId: 'site-2' })).toBe(false);
  });

  it('gives a non-default site only its own records', () => {
    const { result } = renderHookInSite(() => useSiteScope(), {
      site: siteFixture({ id: 'site-2', isDefault: false }),
    });

    expect(result.current.owns({ siteId: 'site-2' })).toBe(true);
    expect(result.current.owns({ siteId: '' })).toBe(false);
  });
});
