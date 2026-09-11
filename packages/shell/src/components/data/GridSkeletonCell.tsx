import type { CellRendererSelectorResult, ICellRendererParams } from 'ag-grid-community';
import { Box, Skeleton } from '@/components/ui';

/** A placeholder bar drawn in each cell of a row whose page is still loading. */
function GridSkeletonCell() {
  return (
    <Box sx={{ height: '100%', display: 'flex', alignItems: 'center' }}>
      <Skeleton variant="text" sx={{ width: '80%' }} data-testid="grid-skeleton-cell" />
    </Box>
  );
}

/**
 * Default-column `cellRendererSelector`: rows of a block the infinite row model has not
 * received yet carry no `data`, so they draw a skeleton. A selector wins over the column's
 * own `cellRenderer`, which is what lets every module's columns share this without change;
 * a loaded row returns `undefined` and falls through to that renderer.
 */
export function skeletonWhileLoading(
  params: ICellRendererParams<unknown>,
): CellRendererSelectorResult | undefined {
  return params.data === undefined ? { component: GridSkeletonCell } : undefined;
}
