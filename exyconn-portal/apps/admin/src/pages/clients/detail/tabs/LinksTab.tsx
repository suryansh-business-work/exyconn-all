import { useState } from 'react';
import { useT } from '@exyconn/i18n';
import { Button, Link, Stack } from '@exyconn/shell/components/ui';
import AddIcon from '@mui/icons-material/Add';
import { CrudDialog } from '@exyconn/shell/components/data/CrudDialog';
import { DataTable, type Column } from '@exyconn/shell/components/data/DataTable';
import { useConfirm } from '@exyconn/shell/components/feedback/ConfirmProvider';
import { useNotify } from '@exyconn/shell/components/feedback/NotificationProvider';
import { errorMessage } from '@exyconn/shell/utils/errorMessage';
import { useClientLinksQuery, useDeleteClientLinkMutation } from '@exyconn/shell/graphql/generated';
import { ClientLinkForm, type ClientLinkRow } from '../forms/client-link';

interface LinksTabProps {
  clientId: string;
  /** Told after a link is added or removed, so the overview recounts. */
  onChanged: () => void;
}

/** Editing state: closed, a new link, or an existing one. */
type Editing = { row: ClientLinkRow | null } | null;

const COLUMNS: Column<ClientLinkRow>[] = [
  { key: 'title', label: 'Title' },
  {
    key: 'url',
    label: 'Address',
    render: (row) => (
      <Link
        href={row.url}
        target="_blank"
        rel="noopener noreferrer"
        sx={{ overflowWrap: 'anywhere' }}
      >
        {row.url}
      </Link>
    ),
  },
  { key: 'description', label: 'Description' },
  { key: 'createdByName', label: 'Added by' },
];

/** Important links for the client — they see the same list in their hub. */
export function LinksTab({ clientId, onChanged }: Readonly<LinksTabProps>) {
  const t = useT();
  const notify = useNotify();
  const confirm = useConfirm();
  const [editing, setEditing] = useState<Editing>(null);
  const { data, loading, refetch } = useClientLinksQuery({ variables: { clientId } });
  const [deleteLink] = useDeleteClientLinkMutation();

  const saved = () => {
    setEditing(null);
    onChanged();
    return refetch();
  };
  const remove = async (row: ClientLinkRow) => {
    const ok = await confirm({
      title: 'Remove link',
      message: 'Remove {title}? The client will no longer see it.',
      messageValues: { title: row.title },
      confirmText: 'Remove',
    });
    if (!ok) return;
    try {
      await deleteLink({ variables: { id: row.id } });
      notify('Link removed', 'success');
      await saved();
    } catch (error) {
      notify(errorMessage(error, t('Could not remove the link')), 'error');
    }
  };
  const title = editing?.row ? t('Edit link') : t('New link');

  return (
    <Stack spacing={2}>
      <Button
        variant="contained"
        startIcon={<AddIcon />}
        onClick={() => setEditing({ row: null })}
        sx={{ alignSelf: 'flex-start' }}
      >
        {t('Add link')}
      </Button>
      <DataTable
        columns={COLUMNS}
        rows={data?.clientLinks ?? []}
        loading={loading}
        onRefresh={refetch}
        onEdit={(row) => setEditing({ row })}
        onDelete={(row) => {
          remove(row).catch((error: unknown) =>
            notify(errorMessage(error, t('Could not remove the link')), 'error'),
          );
        }}
        emptyMessage="No links yet. Add the addresses this client needs to hand."
      />
      <CrudDialog open={editing !== null} title={title} onClose={() => setEditing(null)}>
        {editing && (
          <ClientLinkForm
            clientId={clientId}
            initial={editing.row}
            onDone={() => {
              saved().catch((error: unknown) =>
                notify(errorMessage(error, t('Reload failed')), 'error'),
              );
            }}
            onCancel={() => setEditing(null)}
          />
        )}
      </CrudDialog>
    </Stack>
  );
}
