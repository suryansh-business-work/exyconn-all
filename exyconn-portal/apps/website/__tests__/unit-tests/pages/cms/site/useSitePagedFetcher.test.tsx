import { beforeEach, describe, expect, it, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import {
  NewsletterIssuesDocument,
  type NewsletterIssuesQuery,
} from '@exyconn/shell/graphql/generated';
import { useSitePagedFetcher } from '../../../../../src/pages/cms/site';

const apollo = vi.hoisted(() => ({ query: vi.fn() }));

vi.mock('@apollo/client/react', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@apollo/client/react')>()),
  useApolloClient: () => apollo,
}));

type Select = (data: NewsletterIssuesQuery) => { rows: unknown[]; totalCount: number };

const page = { rows: [{ id: 'issue-1' }], totalCount: 7, extra: 'dropped' };
const pick: Select = (data) => data.newsletterIssues;

function mount(select: Select = pick, siteId = 'site-1') {
  return renderHook(
    (props: Readonly<{ select: Select; siteId: string }>) =>
      useSitePagedFetcher(NewsletterIssuesDocument, props.select, props.siteId),
    { initialProps: { select, siteId } },
  );
}

describe('useSitePagedFetcher', () => {
  beforeEach(() => {
    apollo.query.mockReset();
    apollo.query.mockResolvedValue({ data: { newsletterIssues: page } });
  });

  it("maps the grid's page and search onto the site list, straight from the network", async () => {
    const { result } = mount();

    await expect(result.current({ page: 2, pageSize: 25, search: 'launch' })).resolves.toEqual({
      rows: page.rows,
      totalCount: 7,
    });
    expect(apollo.query).toHaveBeenCalledWith({
      query: NewsletterIssuesDocument,
      variables: { siteId: 'site-1', page: 2, pageSize: 25, search: 'launch' },
      fetchPolicy: 'network-only',
    });
  });

  it('sends no search when the grid has none', async () => {
    const { result } = mount();
    await result.current({ page: 0, pageSize: 10 });

    expect(apollo.query.mock.calls[0][0].variables.search).toBeNull();
  });

  it('reads with the latest picker without changing the fetcher', async () => {
    const { result, rerender } = mount();
    const first = result.current;
    const other = vi.fn<Select>(() => ({ rows: [], totalCount: 0 }));
    rerender({ select: other, siteId: 'site-1' });

    expect(result.current).toBe(first);
    await expect(result.current({ page: 0, pageSize: 10 })).resolves.toEqual({
      rows: [],
      totalCount: 0,
    });
    expect(other).toHaveBeenCalledWith({ newsletterIssues: page });
  });

  it('gives a new fetcher for another site', () => {
    const { result, rerender } = mount();
    const first = result.current;
    rerender({ select: pick, siteId: 'site-2' });

    expect(result.current).not.toBe(first);
  });

  it('rejects when the server answers without data', async () => {
    apollo.query.mockResolvedValue({});
    const { result } = mount();

    await expect(result.current({ page: 0, pageSize: 10 })).rejects.toThrow(
      'The list returned no data',
    );
  });
});
