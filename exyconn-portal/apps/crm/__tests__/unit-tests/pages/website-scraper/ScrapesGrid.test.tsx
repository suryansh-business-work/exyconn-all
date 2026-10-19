import { beforeEach, describe, expect, it, vi } from 'vitest';
import { act, screen } from '@testing-library/react';
import {
  ListWebScrapesPagedDocument,
  type TableQueryInput,
} from '@exyconn/shell/graphql/generated';
import { ScrapesGrid } from '../../../../src/pages/website-scraper/ScrapesGrid';
import { renderWithProviders } from '../../test-utils';
import { formatCell } from '../../grid-helpers';
import { toolsGridProps } from '../tools-grid-stub';
import { scrapeRow } from './scraper-fixtures';

const crud = vi.hoisted(() => ({
  document: null as unknown,
  select: null as ((data: never) => unknown) | null,
  page: vi.fn(),
}));

vi.mock('@exyconn/crud', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@exyconn/crud')>()),
  usePagedFetcher: (document: unknown, select: (data: never) => unknown) => {
    crud.document = document;
    crud.select = select;
    return Object.assign(crud.page, { list: 'listWebScrapesPaged' });
  },
}));

vi.mock('@exyconn/shell/components/data/ServerDataGrid', async () => ({
  ServerDataGrid: (await import('../tools-grid-stub')).ToolsGridStub,
}));

const EMPTY_TITLE = 'No pages scraped yet';
const query = (overrides: Partial<TableQueryInput> = {}) =>
  ({ page: 1, pageSize: 25, ...overrides }) as TableQueryInput;

function renderGrid(refreshSignal = 0) {
  const onOpen = vi.fn();
  renderWithProviders(<ScrapesGrid refreshSignal={refreshSignal} onOpen={onOpen} />);
  return onOpen;
}

async function fetchPage(input: TableQueryInput) {
  let page: unknown;
  await act(async () => {
    page = await toolsGridProps().fetchRows(input);
  });
  return page;
}

describe('ScrapesGrid', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    crud.page.mockResolvedValue({ totalCount: 0, rows: [] });
  });

  it('pages the scrapes through the server grid, keeping the list name for bulk actions', async () => {
    const onOpen = renderGrid(3);
    const result = { totalCount: 1, rows: [scrapeRow()] };
    crud.page.mockResolvedValue(result);

    expect(crud.document).toBe(ListWebScrapesPagedDocument);
    expect(crud.select?.({ listWebScrapesPaged: result } as never)).toBe(result);
    expect(toolsGridProps()).toMatchObject({ refreshSignal: 3, onRowClick: onOpen });
    expect(toolsGridProps().fetchRows).toHaveProperty('list', 'listWebScrapesPaged');
    expect(await fetchPage(query())).toBe(result);
    expect(crud.page).toHaveBeenCalledWith(query());
    expect(screen.queryByText(EMPTY_TITLE)).not.toBeInTheDocument();
  });

  it('shows the empty state when nothing has ever been scraped', async () => {
    renderGrid();

    await fetchPage(query());

    expect(screen.getByText(EMPTY_TITLE)).toBeInTheDocument();
  });

  it('keeps the grid when a search, filter or the archive finds nothing', async () => {
    renderGrid();

    await fetchPage(query({ search: 'acme' }));
    expect(screen.queryByText(EMPTY_TITLE)).not.toBeInTheDocument();

    await fetchPage(
      query({ filters: [{ field: 'url', operator: 'contains', value: 'a' }] } as never),
    );
    expect(screen.queryByText(EMPTY_TITLE)).not.toBeInTheDocument();

    await fetchPage(query({ filters: [], archived: true }));
    expect(screen.queryByText(EMPTY_TITLE)).not.toBeInTheDocument();
  });

  it('names a page by its title, or its URL when untitled, and formats the counts', () => {
    renderGrid();
    const columns = toolsGridProps().columnDefs;

    expect(columns.map((column) => column.field)).toEqual([
      'title',
      'url',
      'charCount',
      'createdByName',
      'createdAt',
      'analyzedAt',
    ]);
    expect(formatCell(columns, 'title', scrapeRow())).toBe('About Acme');
    expect(formatCell(columns, 'title', scrapeRow({ title: '' }))).toBe('https://acme.com/about');
    expect(formatCell(columns, 'charCount', scrapeRow({ charCount: 12500 }))).toBe('12,500');
  });
});
