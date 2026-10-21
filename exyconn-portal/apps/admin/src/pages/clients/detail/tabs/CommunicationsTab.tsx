import { CrudDashboard, useCrudResource, usePagedFetcher } from '@exyconn/crud';
import { useSettings } from '@exyconn/shell/hooks/useSettings';
import {
  ListClientCommunicationsPagedDocument,
  useDeleteClientCommunicationMutation,
  type ListClientCommunicationsPagedQuery,
} from '@exyconn/shell/graphql/generated';
import {
  ClientCommunicationForm,
  type ClientCommunicationRow,
} from '../forms/client-communication';
import { clientFilter } from './clientFilter';
import { COMMUNICATION_COLUMNS, type CommunicationsGridContext } from './communications-grid';

interface CommunicationsTabProps {
  clientId: string;
  /** Told after an entry is added or removed, so the overview recounts. */
  onChanged: () => void;
}

/** Calls, emails, meetings and messages with the client — the log they read in their hub. */
export function CommunicationsTab({ clientId, onChanged }: Readonly<CommunicationsTabProps>) {
  const { formatDateTime } = useSettings();
  const [deleteEntry] = useDeleteClientCommunicationMutation();
  const crud = useCrudResource<ClientCommunicationRow>({
    label: 'Communication',
    scope: 'communication',
    onDelete: (row) => deleteEntry({ variables: { id: row.id } }),
    confirmMessage: (row) => ({
      message: 'Remove "{subject}" from the log? The client will no longer see it.',
      values: { subject: row.subject },
    }),
    refetch: () => {
      onChanged();
      return Promise.resolve();
    },
  });
  const fetchRows = usePagedFetcher(
    ListClientCommunicationsPagedDocument,
    (data: ListClientCommunicationsPagedQuery) => data.listClientCommunicationsPaged,
    clientFilter(clientId),
  );
  const context: CommunicationsGridContext = {
    actions: { edit: crud.openEdit, delete: crud.remove },
    formatDateTime,
  };

  return (
    <CrudDashboard
      title="Communication log"
      subtitle="Every call, email, meeting and message — the client reads the same log"
      entityLabel="communication"
      actionLabel="Log communication"
      stats={[]}
      crud={crud}
      renderForm={(initial) => (
        <ClientCommunicationForm
          clientId={clientId}
          initial={initial}
          onDone={crud.onDone}
          onCancel={crud.close}
        />
      )}
      permissionModule="Client"
      columnDefs={COMMUNICATION_COLUMNS}
      fetchRows={fetchRows}
      context={context}
      searchPlaceholder="Search subject, summary or people…"
    />
  );
}
