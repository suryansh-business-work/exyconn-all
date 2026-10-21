import { useState } from 'react';
import { useT } from '@exyconn/i18n';
import { Button, Link, Stack } from '@exyconn/shell/components/ui';
import ShareIcon from '@mui/icons-material/Share';
import LinkOffIcon from '@mui/icons-material/LinkOff';
import { CrudDialog } from '@exyconn/shell/components/data/CrudDialog';
import { DataTable, type Column, type RowAction } from '@exyconn/shell/components/data/DataTable';
import { StatusChip } from '@exyconn/shell/components/data/StatusChip';
import { useConfirm } from '@exyconn/shell/components/feedback/ConfirmProvider';
import { useNotify } from '@exyconn/shell/components/feedback/NotificationProvider';
import { useSettings } from '@exyconn/shell/hooks/useSettings';
import { errorMessage } from '@exyconn/shell/utils/errorMessage';
import {
  useClientSharedItemsQuery,
  useUnshareWithClientMutation,
} from '@exyconn/shell/graphql/generated';
import { ShareWithClientForm, type ClientSharedItemRow } from '../forms/share-with-client';
import { SharedItemSignature } from '@exyconn/shell/components/clients/SharedItemSignature';

interface SharedItemsTabProps {
  clientId: string;
  /** Told after a share is added or removed, so the overview recounts. */
  onChanged: () => void;
}

/** Contracts, documents and policies from Legal shared with the client, read live. */
export function SharedItemsTab({ clientId, onChanged }: Readonly<SharedItemsTabProps>) {
  const t = useT();
  const notify = useNotify();
  const confirm = useConfirm();
  const { formatDate } = useSettings();
  const [sharing, setSharing] = useState(false);
  const { data, loading, refetch } = useClientSharedItemsQuery({ variables: { clientId } });
  const [unshare] = useUnshareWithClientMutation();

  const reload = () => {
    onChanged();
    refetch().catch((error: unknown) => notify(errorMessage(error, t('Reload failed')), 'error'));
  };
  const stopSharing = async (row: ClientSharedItemRow) => {
    const ok = await confirm({
      title: 'Stop sharing',
      message: 'Stop sharing {title}? The client will no longer see it.',
      messageValues: { title: row.title || row.kind },
      confirmText: 'Stop sharing',
    });
    if (!ok) return;
    await unshare({ variables: { id: row.id } });
    notify('No longer shared', 'success');
    reload();
  };

  const columns: Column<ClientSharedItemRow>[] = [
    { key: 'kind', label: 'Kind', render: (row) => <StatusChip value={row.kind} /> },
    {
      key: 'title',
      label: 'Title',
      render: (row) =>
        row.fileUrl ? (
          <Link href={row.fileUrl} target="_blank" rel="noopener noreferrer">
            {row.title}
          </Link>
        ) : (
          row.title || t('Deleted in Legal')
        ),
    },
    { key: 'status', label: 'Status', render: (row) => <StatusChip value={row.status} /> },
    { key: 'signedAt', label: 'Signature', render: (row) => <SharedItemSignature item={row} /> },
    { key: 'sharedAt', label: 'Shared', render: (row) => formatDate(row.sharedAt) },
    { key: 'note', label: 'Note' },
  ];
  const actions: RowAction<ClientSharedItemRow>[] = [
    {
      icon: <LinkOffIcon fontSize="small" />,
      tooltip: 'Stop sharing',
      ariaLabel: 'stop sharing with the client',
      color: 'error',
      onClick: (row) => {
        stopSharing(row).catch((error: unknown) =>
          notify(errorMessage(error, t('Could not stop sharing')), 'error'),
        );
      },
    },
  ];

  return (
    <Stack spacing={2}>
      <Button
        variant="contained"
        startIcon={<ShareIcon />}
        onClick={() => setSharing(true)}
        sx={{ alignSelf: 'flex-start' }}
      >
        {t('Share from Legal')}
      </Button>
      <DataTable
        columns={columns}
        rows={data?.clientSharedItems ?? []}
        actions={actions}
        loading={loading}
        onRefresh={refetch}
        emptyMessage="Nothing shared yet. Share a contract, document or policy from Legal."
      />
      <CrudDialog
        open={sharing}
        title={t('Share with the client')}
        onClose={() => setSharing(false)}
      >
        {sharing && (
          <ShareWithClientForm
            clientId={clientId}
            onDone={() => {
              setSharing(false);
              reload();
            }}
            onCancel={() => setSharing(false)}
          />
        )}
      </CrudDialog>
    </Stack>
  );
}
