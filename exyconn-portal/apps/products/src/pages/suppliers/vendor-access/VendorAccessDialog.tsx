import { useT } from '@exyconn/i18n';
import BlockIcon from '@mui/icons-material/Block';
import RestoreIcon from '@mui/icons-material/Restore';
import { Divider, Stack, Text } from '@exyconn/shell/components/ui';
import { CrudDialog } from '@exyconn/shell/components/data/CrudDialog';
import { DataTable, type Column, type RowAction } from '@exyconn/shell/components/data/DataTable';
import { StatusChip } from '@exyconn/shell/components/data/StatusChip';
import { EmailLink } from '@exyconn/shell/components/email';
import { useConfirm } from '@exyconn/shell/components/feedback/ConfirmProvider';
import { useNotify } from '@exyconn/shell/components/feedback/NotificationProvider';
import { useSettings } from '@exyconn/shell/hooks/useSettings';
import { errorMessage } from '@exyconn/shell/utils/errorMessage';
import {
  useDeleteVendorContactMutation,
  useSetVendorContactActiveMutation,
  useVendorContactsQuery,
} from '@exyconn/shell/graphql/generated';
import { VendorContactForm, type VendorContactRow } from './forms/vendor-contact';

/** Who at the supplier may sign in to the vendor portal, and a way to give or take access. */
function VendorAccessPanel({ supplierId }: Readonly<{ supplierId: string }>) {
  const t = useT();
  const notify = useNotify();
  const confirm = useConfirm();
  const { formatDate } = useSettings();
  const { data, loading, refetch } = useVendorContactsQuery({ variables: { supplierId } });
  const [setActive] = useSetVendorContactActiveMutation();
  const [deleteContact] = useDeleteVendorContactMutation();

  const run = (work: () => Promise<unknown>, done: string) => {
    work()
      .then(() => {
        notify(done, 'success');
        return refetch();
      })
      .catch((error: unknown) => notify(errorMessage(error, t('Something went wrong')), 'error'));
  };

  const remove = async (row: VendorContactRow) => {
    const ok = await confirm({
      title: 'Remove access',
      message: 'Remove {email} from the vendor portal?',
      messageValues: { email: row.email },
      confirmText: 'Remove',
      destructive: true,
    });
    if (ok) run(() => deleteContact({ variables: { id: row.id } }), t('Access removed'));
  };

  const columns: Column<VendorContactRow>[] = [
    { key: 'name', label: 'Name' },
    { key: 'email', label: 'Email', render: (row) => <EmailLink address={row.email} /> },
    {
      key: 'lastSignInAt',
      label: 'Last sign-in',
      render: (row) => (row.lastSignInAt ? formatDate(row.lastSignInAt) : t('Never')),
    },
    {
      key: 'active',
      label: 'Access',
      render: (row) => <StatusChip value={row.active ? 'ACTIVE' : 'INACTIVE'} />,
    },
  ];
  const toggle = (row: VendorContactRow, active: boolean, done: string) =>
    run(() => setActive({ variables: { id: row.id, active } }), t(done));
  const actions: RowAction<VendorContactRow>[] = [
    {
      icon: <BlockIcon fontSize="small" />,
      tooltip: 'Switch access off',
      ariaLabel: 'switch vendor portal access off',
      color: 'warning',
      hidden: (row) => !row.active,
      onClick: (row) => toggle(row, false, 'Access switched off'),
    },
    {
      icon: <RestoreIcon fontSize="small" />,
      tooltip: 'Switch access back on',
      ariaLabel: 'switch vendor portal access on',
      color: 'success',
      hidden: (row) => row.active,
      onClick: (row) => toggle(row, true, 'Access restored'),
    },
  ];

  return (
    <Stack spacing={2}>
      <Text size="sm" color="text.secondary">
        {t(
          'People listed here sign in at the vendor portal with their email and a one-time code to see purchase orders, acknowledge them and send invoices.',
        )}
      </Text>
      <DataTable
        columns={columns}
        rows={data?.vendorContacts ?? []}
        actions={actions}
        onDelete={(row) => {
          remove(row).catch((error: unknown) => console.error(error));
        }}
        loading={loading}
        emptyMessage="Nobody at this supplier has access yet."
      />
      <Divider />
      <VendorContactForm supplierId={supplierId} onAdded={() => refetch()} />
    </Stack>
  );
}

interface VendorAccessDialogProps {
  supplier: { id: string; name: string } | null;
  onClose: () => void;
}

/** Products › Suppliers › key icon: who at the supplier has vendor portal access. */
export function VendorAccessDialog({ supplier, onClose }: Readonly<VendorAccessDialogProps>) {
  const t = useT();
  const title = supplier ? t('Vendor portal access — {name}', { name: supplier.name }) : '';
  return (
    <CrudDialog open={supplier !== null} title={title} onClose={onClose}>
      {supplier && <VendorAccessPanel supplierId={supplier.id} />}
    </CrudDialog>
  );
}
