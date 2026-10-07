import { beforeEach, describe, expect, it, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useCmsSites } from '../../../../../src/pages/cms/site';
import { rememberSite } from '../../../../../src/pages/cms/site/site-paths';
import { siteFixture } from '../cms-helpers';

const gql = vi.hoisted(() => ({ sites: vi.fn() }));

vi.mock('@exyconn/shell/graphql/generated', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@exyconn/shell/graphql/generated')>()),
  useCmsSitesQuery: (options: unknown) => gql.sites(options),
}));

const main = siteFixture({ id: 'site-1', slug: 'main', isDefault: false });
const blog = siteFixture({ id: 'site-2', slug: 'blog', isDefault: true });
const shop = siteFixture({ id: 'site-3', slug: 'shop', isDefault: false });

const answer = (sites: unknown[] | undefined, loading = false) =>
  gql.sites.mockReturnValue({ data: sites && { cmsSites: sites }, loading });

describe('useCmsSites', () => {
  beforeEach(() => {
    gql.sites.mockReset();
    globalThis.localStorage.clear();
  });

  it('has no sites and nothing preferred while loading', () => {
    answer(undefined, true);
    const { result } = renderHook(() => useCmsSites());

    expect(gql.sites).toHaveBeenCalledWith({ fetchPolicy: 'cache-and-network' });
    expect(result.current.sites).toEqual([]);
    expect(result.current.preferred).toBeUndefined();
    expect(result.current.loading).toBe(true);
  });

  it('prefers the site last worked on', () => {
    rememberSite('shop');
    answer([main, blog, shop]);
    const { result } = renderHook(() => useCmsSites());

    expect(result.current.sites).toEqual([main, blog, shop]);
    expect(result.current.preferred).toBe(shop);
  });

  it('falls back to the default site when the remembered one is gone', () => {
    rememberSite('archived');
    answer([main, blog, shop]);
    const { result } = renderHook(() => useCmsSites());

    expect(result.current.preferred).toBe(blog);
  });

  it('takes the first site when none is default', () => {
    answer([main, shop]);
    const { result } = renderHook(() => useCmsSites());

    expect(result.current.preferred).toBe(main);
  });
});
