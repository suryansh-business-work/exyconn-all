import { useState } from 'react';
import { Box, Button, Stack, Text } from '@/components/ui';
import { DataTable, type Column } from '@/components/data/DataTable';
import { StatusChip } from '@/components/data/StatusChip';
import { PageHeader } from '@/components/layout/PageHeader';
import { glass } from '@/components/glass/glass';
import { useSettings } from '@/hooks/useSettings';
import { useApprovalDecision } from '@/hooks/useApprovalDecision';
import { ApprovalDecision, useMyApprovalsQuery } from '@/graphql/generated';
import { formatMoney } from '@/utils/money';
import { ApprovalKindFilter } from './ApprovalKindFilter';

type Row = {
  id: string;
  kind: string;
  kindLabel: string;
  title: string;
  summary: string;
  requestedByName: string;
  requestedAt: string;
  amount?: number | null;
  currency?: string | null;
};

/** The decision buttons, hoisted so the column model stays a plain render function. */
function DecisionButtons({
  row,
  decide,
}: Readonly<{ row: Row; decide: ReturnType<typeof useApprovalDecision> }>) {
  return (
    <Stack direction="row" spacing={1}>
      <Button size="small" onClick={() => decide(row, ApprovalDecision.Approved)}>
        Approve
      </Button>
      <Button
        size="small"
        color="error"
        variant="outlined"
        onClick={() => decide(row, ApprovalDecision.Rejected)}
      >
        Reject
      </Button>
    </Stack>
  );
}

/** What is at stake, when the decision is about money. */
function amountOf(row: Row): string {
  if (row.amount === null || row.amount === undefined) return '—';
  return formatMoney(row.amount, row.currency ?? 'INR');
}

/**
 * One queue for every decision waiting on the signed-in user.
 *
 * Shared by every portal rather than owned by one, because the point of it is that a
 * manager does not have to remember which module a decision lives in — leave, a claim,
 * a request and claimed off-computer time all arrive here.
 */
export function ApprovalsPage() {
  const [kind, setKind] = useState<string | null>(null);
  const { data, loading, refetch } = useMyApprovalsQuery({
    variables: { kind },
    fetchPolicy: 'cache-and-network',
  });
  const { formatDate } = useSettings();
  const decide = useApprovalDecision(refetch);

  const queue = data?.myApprovals;
  const rows = (queue?.items ?? []) as Row[];
  const groups = queue?.groups ?? [];
  // The server's count is the caller's whole backlog, not the filtered page.
  const total = queue?.totalCount ?? 0;

  const columns: Column<Row>[] = [
    { key: 'kindLabel', label: 'Type', render: (r) => <StatusChip value={r.kindLabel} /> },
    {
      key: 'title',
      label: 'What',
      render: (r) => (
        <Box>
          <Text weight="medium">{r.title}</Text>
          <Text size="caption" color="text.secondary">
            {r.summary}
          </Text>
        </Box>
      ),
    },
    { key: 'requestedByName', label: 'Requested by', render: (r) => r.requestedByName },
    { key: 'requestedAt', label: 'Raised', render: (r) => formatDate(r.requestedAt) },
    { key: 'amount', label: 'Amount', render: amountOf },
    { key: 'actions', label: '', render: (r) => <DecisionButtons row={r} decide={decide} /> },
  ];

  const subtitle = total > 0 ? `${total} waiting on you` : 'Nothing is waiting on you';

  return (
    <Box>
      <PageHeader title="My Approvals" subtitle={subtitle} />
      <ApprovalKindFilter groups={groups} total={total} active={kind} onChange={setKind} />
      <Box sx={[glass, { p: { xs: 1, md: 1.5 } }]}>
        <DataTable
          columns={columns}
          rows={rows}
          emptyMessage="You are all caught up."
          loading={loading}
          onRefresh={refetch}
        />
      </Box>
    </Box>
  );
}
