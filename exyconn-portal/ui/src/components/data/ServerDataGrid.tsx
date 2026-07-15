import { lazy, Suspense } from 'react';
import { Box, CircularProgress } from '@/components/ui';
import type { ServerDataGridProps } from './ServerDataGrid.impl';

export type { TablePageResult } from './ServerDataGrid.impl';

// ag-grid (~1 MB) lives entirely in ServerDataGrid.impl. Loading it through a dynamic
// import keeps ag-grid out of the main bundle — it downloads only when a grid page opens.
const ServerDataGridImpl = lazy(() => import('./ServerDataGrid.impl'));

/** Public, generic entry point that renders the lazily-loaded ag-grid implementation. */
export function ServerDataGrid<T>(props: Readonly<ServerDataGridProps<T>>) {
  const height = props.height ?? 560;
  return (
    <Suspense
      fallback={
        <Box sx={{ display: 'grid', placeItems: 'center', height }}>
          <CircularProgress />
        </Box>
      }
    >
      <ServerDataGridImpl {...(props as unknown as ServerDataGridProps<unknown>)} />
    </Suspense>
  );
}
