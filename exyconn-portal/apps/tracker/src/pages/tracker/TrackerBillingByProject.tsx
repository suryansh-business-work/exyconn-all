import { useMemo } from 'react';
import { ExportCsvButton } from '@exyconn/crud';
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Flex,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Text,
} from '@exyconn/shell/components/ui';
import { glass } from '@exyconn/shell/components/glass/glass';
import { useTrackerBillingByProjectQuery } from '@exyconn/shell/graphql/generated';
import { ProjectBillingRow } from './ProjectBillingRow';
import { TrackerBillingChart } from './TrackerBillingChart';
import { useInvoiceFromTimeLog } from './useInvoiceFromTimeLog';
import { PROJECT_BILLING_CSV, moneyFormat, projectBillingLines } from './tracker.billing';
import type { BillingRange } from './BillingRangePicker';

/**
 * The same billable time, filed under the project it was booked to and set beside what
 * the project agreed. A row invoices straight from here: the server prices the period
 * again from the same data, so the figure confirmed is the figure billed.
 */
export function TrackerBillingByProject({ range }: Readonly<{ range: BillingRange }>) {
  const { data, loading } = useTrackerBillingByProjectQuery({
    variables: { from: range.from, to: range.to },
    fetchPolicy: 'cache-and-network',
  });
  const rows = useMemo(() => data?.trackerBillingByProject ?? [], [data]);
  const money = useMemo(() => moneyFormat(rows[0]?.currency), [rows]);
  const invoice = useInvoiceFromTimeLog(range, money);

  if (loading && !data) {
    return (
      <Flex justifyContent="center" sx={{ py: 4 }}>
        <CircularProgress size={22} aria-label="Loading billing by project" />
      </Flex>
    );
  }

  return (
    <Box sx={{ pt: 2 }}>
      {invoice.raised ? (
        <Alert
          severity="success"
          onClose={invoice.dismiss}
          action={
            <Button color="inherit" size="small" href={invoice.raised.url}>
              Open in Finance
            </Button>
          }
          sx={{ mb: 1.5 }}
        >
          Invoice {invoice.raised.number} was created as a draft.
        </Alert>
      ) : null}

      <TrackerBillingChart
        rows={rows.map((row) => ({ id: row.projectId, name: row.projectName, hours: row.hours }))}
        title="Billable hours by project"
        subtitle="Where the workspace's tracked time was booked"
        labelHeading="Project"
      />

      <Flex direction="row" justifyContent="flex-end" sx={{ mb: 1 }}>
        <ExportCsvButton
          fileName="billing-by-project"
          columns={PROJECT_BILLING_CSV}
          loadRows={() => Promise.resolve(projectBillingLines(rows))}
        />
      </Flex>

      <Box sx={[glass, { p: { xs: 1, md: 1.5 } }]}>
        {rows.length === 0 ? (
          <Box sx={{ p: 4, textAlign: 'center' }}>
            <Text color="text.secondary">No tracked time in this range.</Text>
          </Box>
        ) : (
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell padding="checkbox" />
                  <TableCell>Project</TableCell>
                  <TableCell>Client</TableCell>
                  <TableCell>Hours vs budget</TableCell>
                  <TableCell>Amount vs budget</TableCell>
                  <TableCell />
                </TableRow>
              </TableHead>
              <TableBody>
                {rows.map((row) => (
                  <ProjectBillingRow
                    key={row.projectId || 'none'}
                    row={row}
                    money={money}
                    onInvoice={invoice.raise}
                    invoicing={invoice.raising}
                  />
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Box>
    </Box>
  );
}
