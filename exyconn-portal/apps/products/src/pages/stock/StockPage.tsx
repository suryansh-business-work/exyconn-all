import { useState } from 'react';
import { Box } from '@exyconn/shell/components/ui';
import { PageHeader } from '@exyconn/shell/components/layout/PageHeader';
import { CrudDialog } from '@exyconn/shell/components/data/CrudDialog';
import { glass } from '@exyconn/shell/components/glass/glass';
import { ServerDataGrid } from '@exyconn/shell/components/data/ServerDataGrid';
import { usePagedFetcher } from '@exyconn/crud';
import {
  ListStockMovementsPagedDocument,
  type ListStockMovementsPagedQuery,
} from '@exyconn/shell/graphql/generated';
import { StockMovementForm } from './forms/stock-movement';
import { MOVEMENT_COLUMNS } from './stock-grid';

/**
 * Products → Stock: every change to a stock level, and the only way to make one.
 * The catalogue shows what the level is; this shows how it got there.
 */
export function StockPage() {
  const [recording, setRecording] = useState(false);
  const [refreshSignal, setRefreshSignal] = useState(0);
  const fetchRows = usePagedFetcher(
    ListStockMovementsPagedDocument,
    (data: ListStockMovementsPagedQuery) => data.listStockMovementsPaged,
  );

  return (
    <Box>
      <PageHeader
        title="Stock"
        subtitle="Every movement, and what the level became"
        actionLabel="Record movement"
        onAction={() => setRecording(true)}
      />
      <Box sx={[glass, { p: { xs: 1, md: 1.5 } }]}>
        <ServerDataGrid
          columnDefs={MOVEMENT_COLUMNS}
          fetchRows={fetchRows}
          refreshSignal={refreshSignal}
          searchPlaceholder="Search by product, supplier or reference…"
        />
      </Box>
      <CrudDialog
        open={recording}
        title="Record stock movement"
        onClose={() => setRecording(false)}
      >
        <StockMovementForm
          onCancel={() => setRecording(false)}
          onDone={() => {
            setRecording(false);
            setRefreshSignal((n) => n + 1);
          }}
        />
      </CrudDialog>
    </Box>
  );
}
