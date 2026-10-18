import { useMemo, useState } from 'react';
import type { ColDef } from 'ag-grid-community';
import WebIcon from '@mui/icons-material/Web';
import { useFormatters } from '@exyconn/i18n';
import { dateColumn, textColumn, usePagedFetcher, valueColumn } from '@exyconn/crud';
import { Box } from '@exyconn/shell/components/ui';
import { EmptyState } from '@exyconn/shell/components/feedback/EmptyState';
import { ServerDataGrid, type GridFetcher } from '@exyconn/shell/components/data/ServerDataGrid';
import {
  ListWebScrapesPagedDocument,
  type ListWebScrapesPagedQuery,
  type TableQueryInput,
  type WebScrapeRowFieldsFragment,
} from '@exyconn/shell/graphql/generated';

type Row = WebScrapeRowFieldsFragment;

interface ScrapesGridProps {
  refreshSignal: number;
  onOpen: (row: Row) => void;
}

/** Nothing typed into the search, filters or archive switch: an empty page means no scrapes. */
const isUnfiltered = (input: TableQueryInput) =>
  !input.search && !input.filters?.length && !input.archived;

/** Every page scraped so far, newest first by default; a row opens the page and its AI step. */
export function ScrapesGrid({ refreshSignal, onOpen }: Readonly<ScrapesGridProps>) {
  const { formatDateTime, formatNumber } = useFormatters();
  const [empty, setEmpty] = useState(false);
  const paged = usePagedFetcher(
    ListWebScrapesPagedDocument,
    (data: ListWebScrapesPagedQuery) => data.listWebScrapesPaged,
  );
  // The shared grid keys "Delete selected" and export off `list`, so the wrapper keeps it.
  const fetchRows: GridFetcher<Row> = useMemo(
    () =>
      Object.assign(
        async (input: TableQueryInput) => {
          const page = await paged(input);
          setEmpty(page.totalCount === 0 && isUnfiltered(input));
          return page;
        },
        { list: paged.list },
      ),
    [paged],
  );
  const columns: ColDef<Row>[] = useMemo(
    () => [
      textColumn<Row>('title', 'Page', (row) => row.title || row.url),
      textColumn<Row>('url', 'URL'),
      valueColumn<Row>('charCount', 'Characters', (row) => formatNumber(row.charCount)),
      textColumn<Row>('createdByName', 'Scraped by'),
      dateColumn<Row>('createdAt', 'Scraped'),
      dateColumn<Row>('analyzedAt', 'Sent to AI', '—'),
    ],
    [formatNumber],
  );

  return (
    <>
      {empty && (
        <EmptyState
          icon={<WebIcon />}
          title="No pages scraped yet"
          description="Enter a website above to read its page and keep the text here."
        />
      )}
      <Box sx={{ display: empty ? 'none' : 'block' }}>
        <ServerDataGrid
          columnDefs={columns}
          fetchRows={fetchRows}
          refreshSignal={refreshSignal}
          onRowClick={onOpen}
          context={{ actions: {}, formatDate: formatDateTime }}
          searchPlaceholder="Search by page title, URL or who scraped it…"
        />
      </Box>
    </>
  );
}
