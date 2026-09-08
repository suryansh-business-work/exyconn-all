import { useState } from 'react';
import { Box, Flex } from '@exyconn/shell/components/ui';
import { PageHeader } from '@exyconn/shell/components/layout/PageHeader';
import { CrudFormPage } from '@exyconn/shell/components/data/CrudFormPage';
import { glass } from '@exyconn/shell/components/glass/glass';
import { ServerDataGrid } from '@exyconn/shell/components/data/ServerDataGrid';
import { GridExportButton, useGridQuery, usePagedFetcher } from '@exyconn/crud';
import {
  ListPaymentsPagedDocument,
  type ListPaymentsPagedQuery,
} from '@exyconn/shell/graphql/generated';
import { PaymentForm } from './forms/payment';
import { PAYMENT_COLUMNS } from './payments-grid';

/**
 * Finance → Payments: every receipt against an invoice, and the only way to record one.
 * The invoice list shows what is owed; this shows how it got there.
 */
export function PaymentsPage() {
  const [recording, setRecording] = useState(false);
  const [refreshSignal, setRefreshSignal] = useState(0);
  const gridQuery = useGridQuery();
  const fetchRows = usePagedFetcher(
    ListPaymentsPagedDocument,
    (data: ListPaymentsPagedQuery) => data.listPaymentsPaged,
  );

  if (recording) {
    return (
      <CrudFormPage
        title="Record payment"
        onBack={() => setRecording(false)}
        backLabel="Back to Payments"
      >
        <PaymentForm
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
        title="Payments"
        subtitle="Every receipt, and what it left owing"
        actionLabel="Record payment"
        onAction={() => setRecording(true)}
      />
      <Box sx={[glass, { p: { xs: 1, md: 1.5 } }]}>
        <Flex direction="row" justifyContent="flex-end" sx={{ mb: 1 }}>
          <GridExportButton
            fileName="payments"
            columnDefs={PAYMENT_COLUMNS}
            fetchRows={fetchRows}
            getQuery={gridQuery.getQuery}
          />
        </Flex>
        <ServerDataGrid
          columnDefs={PAYMENT_COLUMNS}
          fetchRows={fetchRows}
          refreshSignal={refreshSignal}
          onQuery={gridQuery.onQuery}
          searchPlaceholder="Search by invoice, client or reference…"
        />
      </Box>
    </Box>
  );
}
