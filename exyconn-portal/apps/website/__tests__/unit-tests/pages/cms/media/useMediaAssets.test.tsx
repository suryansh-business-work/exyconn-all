import { beforeEach, describe, expect, it, vi } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { MEDIA_PAGE_SIZE, useMediaAssets } from '../../../../../src/pages/cms/media/useMediaAssets';

const gql = vi.hoisted(() => ({ assets: vi.fn() }));

vi.mock('@exyconn/shell/graphql/generated', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@exyconn/shell/graphql/generated')>()),
  useCmsAssetsQuery: (options: unknown) => gql.assets(options),
}));

const lastVariables = () => gql.assets.mock.calls.at(-1)?.[0].variables;

describe('useMediaAssets', () => {
  beforeEach(() => {
    gql.assets.mockReset();
    gql.assets.mockReturnValue({ data: undefined, loading: true });
  });

  it('asks for the first page of the site, unsearched, with nothing yet to show', () => {
    const { result } = renderHook(() => useMediaAssets('site-1'));

    expect(MEDIA_PAGE_SIZE).toBe(24);
    expect(gql.assets).toHaveBeenCalledWith({
      variables: { siteId: 'site-1', page: 0, pageSize: 24, search: null },
      fetchPolicy: 'cache-and-network',
    });
    expect(result.current).toMatchObject({
      rows: [],
      totalCount: 0,
      page: 0,
      pageCount: 1,
      loading: true,
    });
  });

  it('pages through the library by its total', () => {
    const rows = [{ id: 'asset-1' }];
    gql.assets.mockReturnValue({ data: { cmsAssets: { rows, totalCount: 50 } }, loading: false });
    const { result } = renderHook(() => useMediaAssets('site-1'));

    expect(result.current.rows).toBe(rows);
    expect(result.current.pageCount).toBe(3);

    act(() => result.current.setPage(2));
    expect(result.current.page).toBe(2);
    expect(lastVariables()).toMatchObject({ page: 2 });
  });

  it('searches trimmed text from the first page again', () => {
    const { result } = renderHook(() => useMediaAssets('site-1'));
    act(() => result.current.setPage(1));

    act(() => result.current.setSearch('  logo '));
    expect(result.current.search).toBe('  logo ');
    expect(result.current.page).toBe(0);
    expect(lastVariables()).toMatchObject({ page: 0, search: 'logo' });

    act(() => result.current.setSearch('   '));
    expect(lastVariables()).toMatchObject({ search: null });
  });
});
