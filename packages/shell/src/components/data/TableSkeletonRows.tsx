import { TableCell, TableRow } from '@/components/ui';
import { SkeletonBone } from '../feedback/skeletons/SkeletonBone';
import { skeletonKeys } from '../feedback/skeletons/skeletonContext';

interface TableSkeletonRowsProps {
  columnKeys: string[];
  /** Adds a trailing placeholder cell under the "Actions" header. */
  withActions: boolean;
  /** How many placeholder rows to draw. */
  rows?: number;
}

/** Placeholder rows a table shows in place of its data while a request is in flight. */
export function TableSkeletonRows({
  columnKeys,
  withActions,
  rows = 5,
}: Readonly<TableSkeletonRowsProps>) {
  const cellKeys = withActions ? [...columnKeys, '__actions'] : columnKeys;
  return skeletonKeys(rows, 'row').map((rowKey) => (
    <TableRow key={rowKey} data-testid="table-skeleton-row">
      {cellKeys.map((cellKey) => (
        <TableCell key={cellKey} sx={{ borderColor: 'divider' }}>
          <SkeletonBone variant="text" />
        </TableCell>
      ))}
    </TableRow>
  ));
}
