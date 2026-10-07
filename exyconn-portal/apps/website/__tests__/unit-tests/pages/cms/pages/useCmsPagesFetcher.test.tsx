import { beforeEach, describe, expect, it, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import { CmsDocumentStatus, CmsPageKind, CmsPagesDocument } from '@exyconn/shell/graphql/generated';
import {
  useCmsPagesFetcher,
  type PageFilters,
} from '../../../../../src/pages/cms/pages/useCmsPagesFetcher';
import { pageRow } from './pages.fixtures';

const apollo = vi.hoisted(() => ({ query: vi.fn() }));

vi.mock('@apollo/client/react', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@apollo/client/react')>()),
  useApolloClient: () => apollo,
}));

const page = { rows: [pageRow()], totalCount: 9 };
const NONE: PageFilters = { status: '', kind: '' };

const mount = (filters: PageFilters = NONE) =>
  renderHook(
    (props: Readonly<{ filters: PageFilters }>) => useCmsPagesFetcher('site-1', props.filters),
    {
      initialProps: { filters },
    },
  );

describe('useCmsPagesFetcher', () => {
  beforeEach(() => {
    apollo.query.mockReset();
    apollo.query.mockResolvedValue({ data: { cmsPages: page } });
  });

  it("maps the grid's page and search onto the site's pages, unfiltered", async () => {
    const { result } = mount();

    await expect(result.current({ page: 1, pageSize: 25, search: 'about' })).resolves.toEqual(page);
    expect(apollo.query).toHaveBeenCalledWith({
      query: CmsPagesDocument,
      variables: {
        siteId: 'site-1',
        input: { page: 1, pageSize: 25, search: 'about', status: null, kind: null },
      },
      fetchPolicy: 'network-only',
    });
  });

  it("reads the toolbar's latest filters at fetch time, without a new fetcher", async () => {
    const { result, rerender } = mount();
    const first = result.current;
    rerender({ filters: { status: CmsDocumentStatus.Draft, kind: CmsPageKind.Template } });

    expect(result.current).toBe(first);
    await result.current({ page: 0, pageSize: 10 });
    expect(apollo.query.mock.calls[0][0].variables.input).toEqual({
      page: 0,
      pageSize: 10,
      search: null,
      status: 'DRAFT',
      kind: 'TEMPLATE',
    });
  });

  it('rejects when the server answers without data', async () => {
    apollo.query.mockResolvedValue({});
    const { result } = mount();

    await expect(result.current({ page: 0, pageSize: 10 })).rejects.toThrow(
      'The pages list returned no data',
    );
  });
});
