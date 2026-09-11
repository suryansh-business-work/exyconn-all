import { lazy, Suspense, useMemo } from 'react';
import { Skeleton, Stack } from '@/components/ui';
import { useSettings } from '@/hooks/useSettings';
import { gridContextWith } from './gridContext';
import type { ServerDataGridProps } from './ServerDataGrid.impl';

export type { GridQuery, TablePageResult } from './ServerDataGrid.impl';

// ag-grid (~1 MB) lives entirely in ServerDataGrid.impl. Loading it through a dynamic
// import keeps ag-grid out of the main bundle — it downloads only when a grid page opens.
const ServerDataGridImpl = lazy(() => import('./ServerDataGrid.impl'));

/** Public, generic entry point that renders the lazily-loaded ag-grid implementation. */
export function ServerDataGrid<T>(props: Readonly<ServerDataGridProps<T>>) {
  const { formatDate } = useSettings();
  const height = props.height ?? 560;
  // Date columns format through the admin-configured settings, whatever the page passed.
  const context = useMemo(
    () => gridContextWith(props.context, formatDate),
    [props.context, formatDate],
  );
  return (
    <Suspense
      fallback={
        <Stack spacing={1} sx={{ height }} aria-busy>
          <Skeleton variant="rounded" height={40} sx={{ width: { xs: '100%', sm: 320 } }} />
          <Skeleton variant="rounded" sx={{ flex: 1 }} />
        </Stack>
      }
    >
      <ServerDataGridImpl
        {...(props as unknown as ServerDataGridProps<unknown>)}
        context={context}
      />
    </Suspense>
  );
}
