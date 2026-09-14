import { useState } from 'react';
import { useT } from '@exyconn/i18n';
import { Chip, Stack } from '@exyconn/shell/components/ui';
import { PageHeader } from '@exyconn/shell/components/layout/PageHeader';
import { CrudDialog } from '@exyconn/shell/components/data/CrudDialog';
import { DataTable, type Column, type RowAction } from '@exyconn/shell/components/data/DataTable';
import {
  OrganizationStatus,
  useOrganizationsQuery,
  useSetOrganizationStatusMutation,
} from '@exyconn/shell/graphql/generated';
import PersonAddAlt1Icon from '@mui/icons-material/PersonAddAlt1';
import BlockIcon from '@mui/icons-material/Block';
import RestoreIcon from '@mui/icons-material/Restore';
import { OrganizationForm, type OrganizationRow } from './forms/organization';
import { OrganizationAdminForm } from './forms/organization-admin';

/** Whether the company may sign in at all — a column cell, so it can translate its own word. */
function OrganizationStatusChip({ status }: Readonly<{ status: OrganizationStatus }>) {
  const t = useT();
  const active = status === OrganizationStatus.Active;
  return (
    <Chip
      size="small"
      label={active ? t('Active') : t('Suspended')}
      color={active ? 'success' : 'warning'}
      variant="outlined"
    />
  );
}

/** What each company is filed under, and the standards its portal runs in. */
const COLUMNS: Column<OrganizationRow>[] = [
  { key: 'name', label: 'Company' },
  { key: 'slug', label: 'Handle' },
  { key: 'country', label: 'Country' },
  { key: 'currency', label: 'Currency' },
  { key: 'locale', label: 'Language' },
  { key: 'timezone', label: 'Timezone' },
  {
    key: 'status',
    label: 'Status',
    render: (row) => <OrganizationStatusChip status={row.status} />,
  },
];

/**
 * The platform's console over the tenancy (SUPER_ADMIN).
 *
 * Create a company, hand it to its first administrator, and suspend it. Nothing here reaches
 * inside a company: what happens in it is administered from within it, by the administrator
 * appointed here.
 */
export function OrganizationsPage() {
  const t = useT();
  const { data, loading, refetch } = useOrganizationsQuery();
  const [setStatus] = useSetOrganizationStatusMutation();
  const [editing, setEditing] = useState<OrganizationRow | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [appointing, setAppointing] = useState<OrganizationRow | null>(null);

  const rows = data?.organizations ?? [];

  const openCreate = () => {
    setEditing(null);
    setFormOpen(true);
  };

  const close = () => {
    setFormOpen(false);
    setAppointing(null);
    refetch().catch((error: unknown) => console.error('Could not reload organizations', error));
  };

  const toggleStatus = async (row: OrganizationRow) => {
    const status =
      row.status === OrganizationStatus.Active
        ? OrganizationStatus.Suspended
        : OrganizationStatus.Active;
    await setStatus({ variables: { id: row.id, status } });
    await refetch();
  };

  const changeStatus = (row: OrganizationRow) => {
    toggleStatus(row).catch((error: unknown) =>
      console.error('Could not change the status', error),
    );
  };

  const actions: RowAction<OrganizationRow>[] = [
    {
      icon: <PersonAddAlt1Icon fontSize="small" />,
      tooltip: 'Appoint administrator',
      ariaLabel: 'Appoint administrator',
      onClick: (row) => setAppointing(row),
    },
    {
      icon: <BlockIcon fontSize="small" />,
      tooltip: 'Suspend this company',
      ariaLabel: 'Suspend this company',
      color: 'warning',
      hidden: (row) => row.status !== OrganizationStatus.Active,
      onClick: changeStatus,
    },
    {
      icon: <RestoreIcon fontSize="small" />,
      tooltip: 'Let this company back in',
      ariaLabel: 'Let this company back in',
      color: 'success',
      hidden: (row) => row.status === OrganizationStatus.Active,
      onClick: changeStatus,
    },
  ];

  const formTitle = editing ? t('Edit {name}', { name: editing.name }) : t('New organization');
  const adminTitle = appointing
    ? t('Administrator for {name}', { name: appointing.name })
    : t('Administrator');

  return (
    <Stack spacing={2}>
      <PageHeader
        title="Organizations"
        subtitle="Every company on this platform, and who administers it"
        actionLabel="New organization"
        onAction={openCreate}
      />
      <DataTable
        columns={COLUMNS}
        rows={rows}
        loading={loading}
        actions={actions}
        onEdit={(row) => {
          setEditing(row);
          setFormOpen(true);
        }}
        emptyMessage="No companies yet. Create the first one to hand it over to its administrator."
        onRefresh={refetch}
      />
      <CrudDialog open={formOpen} title={formTitle} onClose={close}>
        <OrganizationForm initial={editing} onDone={close} onCancel={close} />
      </CrudDialog>
      <CrudDialog open={appointing !== null} title={adminTitle} onClose={close}>
        {appointing ? (
          <OrganizationAdminForm
            organizationId={appointing.id}
            organizationName={appointing.name}
            onDone={close}
            onCancel={close}
          />
        ) : null}
      </CrudDialog>
    </Stack>
  );
}
