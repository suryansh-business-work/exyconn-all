import { useState } from 'react';
import { useFormatters } from '@exyconn/i18n';
import { Box } from '@exyconn/shell/components/ui';
import { DataTable, type Column } from '@exyconn/shell/components/data/DataTable';
import { StatusChip } from '@exyconn/shell/components/data/StatusChip';
import { PageHeader } from '@exyconn/shell/components/layout/PageHeader';
import { useCallingBotRecentCallsQuery } from '@exyconn/shell/graphql/generated';
import { CallTranscriptDialog, type CallRow } from './CallTranscriptDialog';

/** How long a call lasted, as m:ss, once it has answered and ended. */
function lengthOf(call: CallRow): string {
  if (!call.answeredAt || !call.endedAt) {
    return '—';
  }
  const seconds = Math.max(
    0,
    Math.round((Date.parse(call.endedAt) - Date.parse(call.answeredAt)) / 1000),
  );
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;
}

/** Agents > Calling bot > Calls: who called, over what, how it went; click for the words. */
export function CallingBotCallsPanel() {
  const { formatDateTime } = useFormatters();
  const { data, loading, refetch } = useCallingBotRecentCallsQuery({
    fetchPolicy: 'cache-and-network',
  });
  const [open, setOpen] = useState<CallRow | null>(null);

  const columns: Column<CallRow>[] = [
    { key: 'createdAt', label: 'When', render: (r) => formatDateTime(r.createdAt) },
    { key: 'callerName', label: 'Caller', render: (r) => r.callerName || r.callerEmail },
    { key: 'channel', label: 'Over' },
    { key: 'scenarioTitle', label: 'Example', render: (r) => r.scenarioTitle ?? '—' },
    { key: 'status', label: 'Status', render: (r) => <StatusChip value={r.status} /> },
    { key: 'answeredAt', label: 'Length', render: lengthOf },
    { key: 'transcript', label: 'Turns', render: (r) => String(r.transcript.length) },
    // Why a call failed, at a glance: a provider's refusal names the key or setting to fix.
    { key: 'endReason', label: 'Ended because', render: (r) => r.endReason || '—' },
  ];

  return (
    <Box>
      <PageHeader title="Calls" subtitle="The most recent calls with the bot" />
      <DataTable
        columns={columns}
        rows={data?.callingBotRecentCalls ?? []}
        onRowClick={setOpen}
        emptyMessage="No calls yet."
        loading={loading}
        onRefresh={refetch}
      />
      <CallTranscriptDialog call={open} onClose={() => setOpen(null)} />
    </Box>
  );
}
