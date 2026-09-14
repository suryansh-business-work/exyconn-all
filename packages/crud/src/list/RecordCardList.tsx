import { useCallback, useEffect, useMemo, useState } from 'react';
import type { ColDef } from 'ag-grid-community';
import { Alert, Box, Button, Flex, Skeleton, Text, TextField } from '@exyconn/shell/components/ui';
import type { TablePageResult } from '@exyconn/shell/components/data/ServerDataGrid';
import type { TableQueryInput } from '@exyconn/shell/graphql/generated';
import { errorMessage } from '@exyconn/shell/utils/errorMessage';
import { useT } from '@exyconn/i18n';
import { RecordCardRow } from './RecordCardRow';
import { cardActionSpecs } from './recordCard';

/** How long a phone keyboard rests before the list goes and asks the server. */
const SEARCH_DEBOUNCE_MS = 350;
const PAGE_SIZE = 20;

interface RecordCardListProps<Row> {
  columnDefs: ColDef<Row>[];
  fetchRows: (input: TableQueryInput) => Promise<TablePageResult<Row>>;
  context: object;
  searchPlaceholder: string;
  /** Bump to reload after a create, edit or delete elsewhere on the page. */
  refreshSignal?: number;
  onRowClick?: (row: Row) => void;
}

/**
 * The same records a table shows, as cards — what a phone gets instead of a grid.
 *
 * A register is eight to thirteen columns wide, which is five screens of sideways scrolling
 * on a phone before the Edit button. The cards are built from the grid's own column model
 * (`toRecordCard`), so there is no second description of a record to keep in step, and they
 * page against the same server query the table uses.
 */
export function RecordCardList<Row>({
  columnDefs,
  fetchRows,
  context,
  searchPlaceholder,
  refreshSignal,
  onRowClick,
}: Readonly<RecordCardListProps<Row>>) {
  const [typed, setTyped] = useState('');
  const [search, setSearch] = useState('');
  const [rows, setRows] = useState<Row[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const t = useT();

  useEffect(() => {
    const timer = setTimeout(() => setSearch(typed.trim()), SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [typed]);

  // A new search, or a save elsewhere on the page, starts the list again from the top.
  useEffect(() => {
    setPage(0);
  }, [search, refreshSignal]);

  useEffect(() => {
    let live = true;
    setLoading(true);
    fetchRows({ page, pageSize: PAGE_SIZE, search: search === '' ? null : search })
      .then((result) => {
        if (!live) {
          return;
        }
        setError(null);
        setTotal(result.totalCount);
        setRows((loaded) => (page === 0 ? result.rows : [...loaded, ...result.rows]));
      })
      .catch(
        (cause: unknown) => live && setError(errorMessage(cause, t('Could not load this list'))),
      )
      .finally(() => live && setLoading(false));
    return () => {
      live = false;
    };
  }, [fetchRows, page, search, refreshSignal, t]);

  const specs = useMemo(() => cardActionSpecs(columnDefs), [columnDefs]);
  const more = useCallback(() => setPage((current) => current + 1), []);
  const loaded = rows.length;

  return (
    <Flex direction="column" spacing={1.5}>
      <TextField
        value={typed}
        onChange={(event) => setTyped(event.target.value)}
        placeholder={searchPlaceholder}
        slotProps={{ htmlInput: { 'aria-label': searchPlaceholder } }}
        fullWidth
      />

      {error && <Alert severity="error">{error}</Alert>}

      {rows.map((row, index) => (
        <RecordCardRow
          // The row's own id when it has one; the list is append-only, so the index is
          // stable for anything without one.
          key={(row as { id?: string }).id ?? `row-${index}`}
          row={row}
          columnDefs={columnDefs}
          context={context}
          actionSpecs={specs}
          onClick={onRowClick}
        />
      ))}

      {loading && <Skeleton variant="rounded" height={96} />}

      {!loading && loaded === 0 && !error && (
        <Box sx={{ py: 4, textAlign: 'center' }}>
          <Text color="text.secondary">{t('Nothing to show yet.')}</Text>
        </Box>
      )}

      {loaded > 0 && (
        <Flex direction="column" spacing={1} alignItems="center">
          <Text size="caption" color="text.secondary">
            {t('{loaded} of {total}', { loaded, total })}
          </Text>
          {loaded < total && (
            <Button onClick={more} disabled={loading} fullWidth>
              {t('Load more')}
            </Button>
          )}
        </Flex>
      )}
    </Flex>
  );
}
