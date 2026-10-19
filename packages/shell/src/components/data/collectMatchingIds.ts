import type { GridFetcher } from './ServerDataGrid.types';
import type { GridQuery } from './serverGridQuery';
import { selectedIdsOf } from './tableBulkCopy';

/** The largest page the server serves; collecting reads this many rows per request. */
const COLLECT_PAGE_SIZE = 200;

/** The most rows "Select all matching" acts on; above it the person narrows the filters. */
export const MAX_MATCHING_ROWS = 10_000;

/**
 * Every id matching `query` (search, filters, sorts, archived — exactly what the grid shows),
 * read page by page through the grid's own fetcher, one request after another. Stops at the
 * last page, once the server's total is reached, or at {@link MAX_MATCHING_ROWS}. A row that
 * shifts onto the next page while paging is counted once.
 */
export async function collectMatchingIds(
  fetchRows: GridFetcher<unknown>,
  query: GridQuery,
  onProgress: (done: number, total: number) => void,
): Promise<string[]> {
  const ids = new Set<string>();
  for (let page = 0; page * COLLECT_PAGE_SIZE < MAX_MATCHING_ROWS; page += 1) {
    const result = await fetchRows({ ...query, page, pageSize: COLLECT_PAGE_SIZE });
    for (const id of selectedIdsOf(result.rows)) {
      ids.add(id);
    }
    onProgress(ids.size, result.totalCount);
    if (result.rows.length < COLLECT_PAGE_SIZE || ids.size >= result.totalCount) {
      break;
    }
  }
  return [...ids];
}
