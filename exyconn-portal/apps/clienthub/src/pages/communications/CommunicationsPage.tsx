import { useState } from 'react';
import { CrudDashboard, usePagedFetcher } from '@exyconn/crud';
import { useSettings } from '@exyconn/shell/hooks/useSettings';
import {
  ClientHubCommunicationsDocument,
  type ClientHubCommunicationsQuery,
} from '@exyconn/shell/graphql/generated';
import {
  HUB_COMMUNICATION_COLUMNS,
  type HubCommunicationRow,
  type HubCommunicationsContext,
} from './communications-grid';
import { CommunicationDialog } from './CommunicationDialog';

/** Every call, email, meeting and message between the client and our team. */
export function CommunicationsPage() {
  const { formatDateTime } = useSettings();
  const [open, setOpen] = useState<HubCommunicationRow | null>(null);
  const fetchRows = usePagedFetcher(
    ClientHubCommunicationsDocument,
    (data: ClientHubCommunicationsQuery) => data.clientHubCommunications,
  );
  const context: HubCommunicationsContext = { actions: { open: setOpen }, formatDateTime };
  return (
    <CrudDashboard
      title="Communication log"
      subtitle="Every call, email, meeting and message with our team, and what was agreed"
      entityLabel="communication"
      exportFileName="communication-log"
      stats={[]}
      columnDefs={HUB_COMMUNICATION_COLUMNS}
      fetchRows={fetchRows}
      context={context}
      onRowClick={setOpen}
      searchPlaceholder="Search subject, summary or people…"
      extraDialogs={<CommunicationDialog entry={open} onClose={() => setOpen(null)} />}
    />
  );
}
