import { Box } from '@exyconn/shell/components/ui';
import { ServerDataGrid } from '@exyconn/shell/components/data/ServerDataGrid';
import { usePagedFetcher } from '@exyconn/crud';
import {
  ListEmailLogsPagedDocument,
  type ListEmailLogsPagedQuery,
} from '@exyconn/shell/graphql/generated';
import { LOG_COLUMNS } from './email-grids';

/**
 * Tech → Email → Logs: every attempt to send, whether it worked or not.
 *
 * The failures are the point. "The customer says they never got the contract" is
 * unanswerable without a record of what was sent, to whom, and what the mail server said
 * when it refused — so a failure is kept with its reason rather than vanishing into stdout.
 */
export function EmailLogsPanel() {
  const fetchRows = usePagedFetcher(
    ListEmailLogsPagedDocument,
    (data: ListEmailLogsPagedQuery) => data.listEmailLogsPaged,
  );

  return (
    <Box>
      <ServerDataGrid
        columnDefs={LOG_COLUMNS}
        fetchRows={fetchRows}
        searchPlaceholder="Search by template, recipient, subject or failure…"
      />
    </Box>
  );
}
