import { useState } from 'react';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import { useT } from '@exyconn/i18n';
import { Box, Button, Flex, Text } from '@exyconn/shell/components/ui';
import { DataTable, type Column, type RowAction } from '@exyconn/shell/components/data/DataTable';
import { CrudDialog } from '@exyconn/shell/components/data/CrudDialog';
import { StatusChip } from '@exyconn/shell/components/data/StatusChip';
import { useConfirm } from '@exyconn/shell/components/feedback/ConfirmProvider';
import { useNotify } from '@exyconn/shell/components/feedback/NotificationProvider';
import { errorMessage } from '@exyconn/shell/utils/errorMessage';
import { useDeleteTechProviderLoginMutation } from '@exyconn/shell/graphql/generated';
import { ProviderLoginForm, type ProviderLoginRow } from './forms/provider-login';

interface ProviderLoginsProps {
  provider: string;
  logins: readonly ProviderLoginRow[];
}

/** The accounts the keys were created under, with an add/edit drawer. */
export function ProviderLogins({ provider, logins }: Readonly<ProviderLoginsProps>) {
  const t = useT();
  const confirm = useConfirm();
  const notify = useNotify();
  const [editing, setEditing] = useState<ProviderLoginRow | null | undefined>(undefined);
  const [remove] = useDeleteTechProviderLoginMutation({ refetchQueries: ['TechProviderProfile'] });
  const close = () => setEditing(undefined);

  const removeLogin = async (row: ProviderLoginRow) => {
    const ok = await confirm({
      title: 'Remove account',
      message: 'Remove the saved account "{label}"?',
      messageValues: { label: row.label },
      confirmText: 'Remove',
      destructive: true,
    });
    if (!ok) {
      return;
    }
    try {
      await remove({ variables: { provider, id: row.id } });
      notify('Account removed');
    } catch (err) {
      notify(errorMessage(err, 'Could not remove the account'), 'error');
    }
  };

  const columns: Column<ProviderLoginRow>[] = [
    { key: 'label', label: 'Account' },
    { key: 'signInMethod', label: 'Sign-in', render: (r) => <StatusChip value={r.signInMethod} /> },
    { key: 'username', label: 'Email or username', render: (r) => r.username || '—' },
    {
      key: 'hasPassword',
      label: 'Password',
      render: (r) => (r.hasPassword ? r.passwordHint : '—'),
    },
  ];
  const actions: RowAction<ProviderLoginRow>[] = [
    {
      icon: <EditIcon fontSize="small" />,
      tooltip: 'Edit',
      ariaLabel: 'edit',
      onClick: setEditing,
    },
    {
      icon: <DeleteIcon fontSize="small" />,
      tooltip: 'Remove',
      ariaLabel: 'remove',
      color: 'error',
      onClick: (row) => {
        removeLogin(row).catch((err: unknown) =>
          notify(errorMessage(err, 'Could not remove'), 'error'),
        );
      },
    },
  ];

  return (
    <Box>
      <Flex direction="row" justifyContent="space-between" alignItems="center" wrap spacing={1}>
        <Text weight="medium">{t('Account logins')}</Text>
        <Button size="small" startIcon={<AddIcon />} onClick={() => setEditing(null)}>
          {t('Add login')}
        </Button>
      </Flex>
      <Text size="sm" color="text.secondary" sx={{ mb: 1 }}>
        {t(
          'The accounts these keys were created under, so the next person can sign in to the console.',
        )}
      </Text>
      <DataTable
        columns={columns}
        rows={[...logins]}
        actions={actions}
        emptyMessage="No login saved yet."
      />
      <CrudDialog
        open={editing !== undefined}
        title={editing ? t('Edit login') : t('Add login')}
        onClose={close}
      >
        {editing !== undefined && (
          <ProviderLoginForm
            provider={provider}
            initial={editing}
            onDone={close}
            onCancel={close}
          />
        )}
      </CrudDialog>
    </Box>
  );
}
