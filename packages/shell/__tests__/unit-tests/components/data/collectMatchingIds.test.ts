import { describe, expect, it, vi } from 'vitest';
import type { TableQueryInput } from '@/graphql/generated';
import { SortDir } from '@/graphql/generated';
import { collectMatchingIds, MAX_MATCHING_ROWS } from '@/components/data/collectMatchingIds';
import type { GridQuery } from '@/components/data/serverGridQuery';
import type { TablePageResult } from '@/components/data/ServerDataGrid.types';

type Fetch = (input: TableQueryInput) => Promise<TablePageResult<unknown>>;

const QUERY: GridQuery = {
  search: 'acme',
  sort: { field: 'name', dir: SortDir.Asc },
  sorts: [{ field: 'name', dir: SortDir.Asc }],
  filters: [],
  archived: true,
};

/** A server holding `total` matching rows, serving whichever page is asked for. */
function serverOf(total: number) {
  return vi.fn<Fetch>(async ({ page, pageSize }) => {
    const start = page * pageSize;
    const count = Math.max(0, Math.min(pageSize, total - start));
    const rows = Array.from({ length: count }, (_, index) => ({ id: `r${start + index + 1}` }));
    return { rows, totalCount: total };
  });
}

describe('collectMatchingIds', () => {
  it('pages through the exact query at 200 a request, reporting progress, until the total', async () => {
    const fetchRows = serverOf(450);
    const progress: Array<[number, number]> = [];

    const ids = await collectMatchingIds(fetchRows, QUERY, (done, total) =>
      progress.push([done, total]),
    );

    expect(ids).toHaveLength(450);
    expect(ids[0]).toBe('r1');
    expect(ids[449]).toBe('r450');
    expect(fetchRows).toHaveBeenCalledTimes(3);
    expect(fetchRows).toHaveBeenNthCalledWith(2, { ...QUERY, page: 1, pageSize: 200 });
    expect(progress).toEqual([
      [200, 450],
      [400, 450],
      [450, 450],
    ]);
  });

  it('stops once the server total is reached, without asking for an empty page', async () => {
    const fetchRows = serverOf(400);
    expect(await collectMatchingIds(fetchRows, QUERY, vi.fn())).toHaveLength(400);
    expect(fetchRows).toHaveBeenCalledTimes(2);
  });

  it('counts a row once when it shifts onto the next page while paging', async () => {
    const page = (from: number) =>
      Array.from({ length: 200 }, (_, index) => ({ id: `r${from + index}` }));
    const fetchRows = vi
      .fn<Fetch>()
      .mockResolvedValueOnce({ rows: page(1), totalCount: 300 })
      .mockResolvedValueOnce({ rows: [...page(200).slice(0, 101)], totalCount: 300 });

    const ids = await collectMatchingIds(fetchRows, QUERY, vi.fn());

    expect(ids).toHaveLength(300);
    expect(new Set(ids).size).toBe(300);
  });

  it('skips rows without an id and never reads past the cap', async () => {
    const fetchRows = vi.fn<Fetch>(async () => ({
      rows: Array.from({ length: 200 }, () => ({ name: 'no id' })),
      totalCount: 50_000,
    }));

    expect(await collectMatchingIds(fetchRows, QUERY, vi.fn())).toEqual([]);
    expect(fetchRows).toHaveBeenCalledTimes(MAX_MATCHING_ROWS / 200);
  });

  it('passes a failed request on', async () => {
    const fetchRows = vi.fn<Fetch>().mockRejectedValue(new Error('Offline'));
    await expect(collectMatchingIds(fetchRows, QUERY, vi.fn())).rejects.toThrow('Offline');
  });
});
