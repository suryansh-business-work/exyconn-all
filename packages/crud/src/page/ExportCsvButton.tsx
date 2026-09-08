import { useCallback, useMemo, useRef, useState } from 'react';
import { useApolloClient } from '@apollo/client';
import type { ColDef } from 'ag-grid-community';
import DownloadIcon from '@mui/icons-material/Download';
import { Button } from '@exyconn/shell/components/ui';
import { useNotify } from '@exyconn/shell/components/feedback/NotificationProvider';
import { gridContextWith } from '@exyconn/shell/components/data/gridContext';
import type { GridQuery, TablePageResult } from '@exyconn/shell/components/data/ServerDataGrid';
import { useSettings } from '@exyconn/shell/hooks/useSettings';
import {
  CanExportDocument,
  type CanExportQuery,
  type CanExportQueryVariables,
  type TableQueryInput,
} from '@exyconn/shell/graphql/generated';
import { downloadCsv, toCsv, type CsvColumn } from '@exyconn/shell/utils/csv';
import { errorMessage } from '@exyconn/shell/utils/errorMessage';
import { csvColumnsFromDefs, fetchAllRows } from './export';
import { assertExportAllowed } from './permissions';

interface ExportCsvButtonProps<Row> {
  /** The file's name; the date is appended and `.csv` added. */
  fileName: string;
  columns: CsvColumn<Row>[];
  /** Everything to export — loaded on click, so a grid can fetch every page it has. */
  loadRows: () => Promise<Row[]>;
}

/** Exports rows as a CSV file and says how many went out. */
export function ExportCsvButton<Row>({
  fileName,
  columns,
  loadRows,
}: Readonly<ExportCsvButtonProps<Row>>) {
  const notify = useNotify();
  const [busy, setBusy] = useState(false);

  const exportCsv = async () => {
    setBusy(true);
    try {
      const rows = await loadRows();
      const stamp = new Date().toISOString().slice(0, 10);
      downloadCsv(`${fileName}-${stamp}`, toCsv(rows, columns));
      notify(`Exported ${rows.length} rows.`, 'success');
    } catch (error) {
      notify(errorMessage(error, 'The export failed.'), 'error');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Button size="small" startIcon={<DownloadIcon />} onClick={exportCsv} disabled={busy}>
      Export CSV
    </Button>
  );
}

/** The grid's last query, kept where an export can read it at click time. */
export interface GridQueryTracker {
  /** Hand to `ServerDataGrid`'s `onQuery`. Stable, so the grid's datasource is not rebuilt. */
  onQuery: (query: GridQuery) => void;
  getQuery: () => GridQuery;
}

const EMPTY_QUERY: GridQuery = { search: null, sort: null, filters: [] };

/** Remembers what a `ServerDataGrid` last asked for — see {@link GridExportButton}. */
export function useGridQuery(): GridQueryTracker {
  const ref = useRef<GridQuery>(EMPTY_QUERY);
  const onQuery = useCallback((query: GridQuery) => {
    ref.current = query;
  }, []);
  const getQuery = useCallback(() => ref.current, []);
  return useMemo(() => ({ onQuery, getQuery }), [onQuery, getQuery]);
}

interface GridExportButtonProps<Row> {
  fileName: string;
  columnDefs: readonly ColDef<Row>[];
  fetchRows: (input: TableQueryInput) => Promise<TablePageResult<Row>>;
  /** The grid's current search/sort/filters — from {@link useGridQuery}. */
  getQuery: () => GridQuery;
  /** What the page hands ag-grid; date columns read `formatDate` off it. */
  context?: object;
  /**
   * The permission module to clear the export with. Set it and the server is asked once,
   * before the first page, whether this role may export at all.
   */
  permissionModule?: string;
}

/**
 * Exports every row a server-paged grid could show — all pages, under the search, sort
 * and filters currently applied — flattened through the same column model the grid draws.
 */
export function GridExportButton<Row>({
  fileName,
  columnDefs,
  fetchRows,
  getQuery,
  context,
  permissionModule,
}: Readonly<GridExportButtonProps<Row>>) {
  const { formatDate } = useSettings();
  const client = useApolloClient();
  const columns = useMemo(
    () => csvColumnsFromDefs(columnDefs, gridContextWith(context, formatDate)),
    [columnDefs, context, formatDate],
  );
  const canExport = useCallback(
    async (module: string) => {
      const { data } = await client.query<CanExportQuery, CanExportQueryVariables>({
        query: CanExportDocument,
        variables: { module },
        fetchPolicy: 'network-only',
      });
      return data.canExport;
    },
    [client],
  );
  const loadRows = useCallback(async () => {
    if (permissionModule) {
      await assertExportAllowed(canExport, permissionModule);
    }
    return fetchAllRows(fetchRows, getQuery());
  }, [permissionModule, canExport, fetchRows, getQuery]);
  return <ExportCsvButton fileName={fileName} columns={columns} loadRows={loadRows} />;
}
