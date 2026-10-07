import { beforeEach, describe, expect, it, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import { CmsFragmentKind, CmsPageKind } from '@exyconn/shell/graphql/generated';
import { useSiteOptions } from '../../../../../../src/pages/website/forms/cms-site/useSiteOptions';

const gql = vi.hoisted(() => ({ fragments: vi.fn(), designs: vi.fn(), pages: vi.fn() }));

vi.mock('@exyconn/shell/graphql/generated', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@exyconn/shell/graphql/generated')>()),
  useCmsFragmentsQuery: (options: unknown) => gql.fragments(options),
  useCmsDesignSystemsQuery: (options: unknown) => gql.designs(options),
  useCmsPagesQuery: (options: unknown) => gql.pages(options),
}));

const NONE = { value: '', label: 'None' };

describe('useSiteOptions', () => {
  beforeEach(() => {
    gql.fragments.mockReset().mockReturnValue({ data: undefined });
    gql.designs.mockReset().mockReturnValue({ data: undefined });
    gql.pages.mockReset().mockReturnValue({ data: undefined });
  });

  it('offers only "None" and asks nothing for a site not saved yet', () => {
    const { result } = renderHook(() => useSiteOptions(undefined));

    expect(result.current).toEqual({
      headers: [NONE],
      footers: [NONE],
      designSystems: [NONE],
      pages: [NONE],
    });
    expect(gql.fragments).toHaveBeenCalledWith({ variables: { siteId: '' }, skip: true });
    expect(gql.designs).toHaveBeenCalledWith({ variables: { siteId: '' }, skip: true });
    expect(gql.pages).toHaveBeenCalledWith({
      variables: { siteId: '', input: { page: 0, pageSize: 200, kind: CmsPageKind.Page } },
      skip: true,
    });
  });

  it("lists the site's headers, footers, design systems and pages", () => {
    gql.fragments.mockReturnValue({
      data: {
        cmsFragments: [
          { id: 'frag-h', name: 'Main header', kind: CmsFragmentKind.Header },
          { id: 'frag-f', name: 'Main footer', kind: CmsFragmentKind.Footer },
          { id: 'frag-s', name: 'Hero', kind: CmsFragmentKind.Section },
        ],
      },
    });
    gql.designs.mockReturnValue({ data: { cmsDesignSystems: [{ id: 'ds-1', name: 'Brand' }] } });
    gql.pages.mockReturnValue({
      data: { cmsPages: { rows: [{ id: 'page-404', title: 'Not found', path: '/404' }] } },
    });

    const { result } = renderHook(() => useSiteOptions('site-1'));

    expect(result.current.headers).toEqual([NONE, { value: 'frag-h', label: 'Main header' }]);
    expect(result.current.footers).toEqual([NONE, { value: 'frag-f', label: 'Main footer' }]);
    expect(result.current.designSystems).toEqual([NONE, { value: 'ds-1', label: 'Brand' }]);
    expect(result.current.pages).toEqual([NONE, { value: 'page-404', label: 'Not found (/404)' }]);
    expect(gql.fragments).toHaveBeenCalledWith({ variables: { siteId: 'site-1' }, skip: false });
  });
});
