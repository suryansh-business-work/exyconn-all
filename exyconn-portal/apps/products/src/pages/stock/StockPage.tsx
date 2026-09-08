import { useState } from 'react';
import { Box, Flex } from '@exyconn/shell/components/ui';
import { PageHeader } from '@exyconn/shell/components/layout/PageHeader';
import { CrudFormPage } from '@exyconn/shell/components/data/CrudFormPage';
import { glass } from '@exyconn/shell/components/glass/glass';
import { ServerDataGrid } from '@exyconn/shell/components/data/ServerDataGrid';
import { GridExportButton, useGridQuery, usePagedFetcher } from '@exyconn/crud';
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
  const gridQuery = useGridQuery();
  const fetchRows = usePagedFetcher(
    ListStockMovementsPagedDocument,
    (data: ListStockMovementsPagedQuery) => data.listStockMovementsPaged,
  );

  if (recording) {
    return (
      <CrudFormPage
        title="Record stock movement"
        onBack={() => setRecording(false)}
        backLabel="Back to Stock"
      >
        <StockMovementForm
          onCancel={() => setRecording(false)}
          onDone={() => {
            setRecording(false);
            setRefreshSignal((n) => n + 1);
          }}
        />
      </CrudFormPage>
    );
  }

  return (
    <Box>
      <PageHeader
        title="Stock"
        subtitle="Every movement, and what the level became"
        actionLabel="Record movement"
        onAction={() => setRecording(true)}
      />
      <Box sx={[glass, { p: { xs: 1, md: 1.5 } }]}>
        <Flex direction="row" justifyContent="flex-end" sx={{ mb: 1 }}>
          <GridExportButton
            fileName="stock-movements"
            columnDefs={MOVEMENT_COLUMNS}
            fetchRows={fetchRows}
            getQuery={gridQuery.getQuery}
          />
        </Flex>
        <ServerDataGrid
          columnDefs={MOVEMENT_COLUMNS}
          fetchRows={fetchRows}
          refreshSignal={refreshSignal}
          onQuery={gridQuery.onQuery}
          searchPlaceholder="Search by product, supplier or reference…"
        />
      </Box>
    </Box>
  );
}
