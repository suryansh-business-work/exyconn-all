import type { ColDef } from 'ag-grid-community';
import { useMediaQuery, useTheme } from '@exyconn/shell/components/ui';
import {
  ServerDataGrid,
  type GridFetcher,
  type GridQuery,
} from '@exyconn/shell/components/data/ServerDataGrid';
import { RecordCardList } from '../list/RecordCardList';

interface CrudGridProps<TPaged> {
  columnDefs: ColDef<TPaged>[];
  fetchRows: GridFetcher<TPaged>;
  context: object;
  refreshSignal: number;
  onRowClick?: (row: TPaged) => void;
  searchPlaceholder: string;
  initialSearch?: string;
  onQuery: (query: GridQuery) => void;
  /** See ServerDataGrid's `bulkList`. */
  bulkList?: string;
  onBulkDone?: () => void;
}

/**
 * A dashboard's records: the server-driven grid (with its bulk actions) on a wide screen, and
 * on a phone the same records as cards — a thirteen-column table is five screens of sideways
 * scrolling there. Same columns, same actions, same query.
 */
export function CrudGrid<TPaged>({
  columnDefs,
  fetchRows,
  context,
  refreshSignal,
  onRowClick,
  searchPlaceholder,
  initialSearch,
  onQuery,
  bulkList,
  onBulkDone,
}: Readonly<CrudGridProps<TPaged>>) {
  const theme = useTheme();
  const onPhone = useMediaQuery(theme.breakpoints.down('sm'));
  if (onPhone) {
    return (
      <RecordCardList<TPaged>
        columnDefs={columnDefs}
        fetchRows={fetchRows}
        context={context}
        refreshSignal={refreshSignal}
        onRowClick={onRowClick}
        searchPlaceholder={searchPlaceholder}
        initialSearch={initialSearch}
      />
    );
  }
  return (
    <ServerDataGrid<TPaged>
      columnDefs={columnDefs}
      fetchRows={fetchRows}
      context={context}
      refreshSignal={refreshSignal}
      onRowClick={onRowClick}
      searchPlaceholder={searchPlaceholder}
      initialSearch={initialSearch}
      onQuery={onQuery}
      bulkList={bulkList}
      onBulkDone={onBulkDone}
    />
  );
}
