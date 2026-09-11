import { Skeleton, TableCell, TableRow } from '@/components/ui';

/** Stable keys for the placeholder rows — there is no data yet to key them by. */
const SKELETON_ROW_KEYS = ['s1', 's2', 's3', 's4', 's5'];

interface TableSkeletonRowsProps {
  columnKeys: string[];
  /** Adds a trailing placeholder cell under the "Actions" header. */
  withActions: boolean;
}

/** Placeholder rows a table shows in place of its data while a request is in flight. */
export function TableSkeletonRows({ columnKeys, withActions }: Readonly<TableSkeletonRowsProps>) {
  const cellKeys = withActions ? [...columnKeys, '__actions'] : columnKeys;
  return SKELETON_ROW_KEYS.map((rowKey) => (
    <TableRow key={rowKey} data-testid="table-skeleton-row">
      {cellKeys.map((cellKey) => (
        <TableCell key={cellKey} sx={{ borderColor: 'divider' }}>
          <Skeleton variant="text" />
        </TableCell>
      ))}
    </TableRow>
  ));
}
