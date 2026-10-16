import { Box, Stack, Table, TableBody } from '@/components/ui';
import { glass } from '../../glass/glass';
import { TableSkeletonRows } from '../../data/TableSkeletonRows';
import { SkeletonBone } from './SkeletonBone';
import { SkeletonStatus } from './SkeletonStatus';
import { skeletonKeys } from './skeletonContext';

interface ListSkeletonProps {
  rows?: number;
  columns?: number;
  /** Draws the search-and-filter strip above the table. */
  toolbar?: boolean;
  label?: string;
}

/** A register: its toolbar, then a table of rows — the shape of a `DataTable` page. */
export function ListSkeleton({
  rows = 5,
  columns = 4,
  toolbar = true,
  label,
}: Readonly<ListSkeletonProps>) {
  return (
    <SkeletonStatus label={label}>
      {toolbar ? (
        <Stack direction="row" spacing={1} sx={{ mb: 2 }} data-testid="skeleton-list-toolbar">
          <SkeletonBone variant="rounded" sx={{ width: { xs: '100%', sm: 280 }, height: 40 }} />
          <SkeletonBone variant="rounded" sx={{ width: 96, height: 40, flexShrink: 0 }} />
        </Stack>
      ) : null}
      <Box sx={[glass, { overflow: 'hidden' }]}>
        <Table size="small">
          <TableBody>
            <TableSkeletonRows
              columnKeys={skeletonKeys(columns, 'col')}
              withActions={false}
              rows={rows}
            />
          </TableBody>
        </Table>
      </Box>
    </SkeletonStatus>
  );
}
