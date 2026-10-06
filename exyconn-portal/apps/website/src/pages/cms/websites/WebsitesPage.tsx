import { useNavigate } from 'react-router-dom';
import StarIcon from '@mui/icons-material/Star';
import LaunchIcon from '@mui/icons-material/Launch';
import { useT } from '@exyconn/i18n';
import { DataTable, type Column } from '@exyconn/shell/components/data/DataTable';
import { StatusChip } from '@exyconn/shell/components/data/StatusChip';
import { CrudFormPage } from '@exyconn/shell/components/data/CrudFormPage';
import { ModuleDashboard } from '@exyconn/shell/components/dashboard/ModuleDashboard';
import type { StatItem } from '@exyconn/shell/components/dashboard/StatCard';
import { Chip, color } from '@exyconn/shell/components/ui';
import { useCrudResource } from '@exyconn/crud';
import { useSettings } from '@exyconn/shell/hooks/useSettings';
import { useDeleteCmsSiteMutation } from '@exyconn/shell/graphql/generated';
import { CmsSiteForm, type CmsSiteRow } from '../../website/forms/cms-site';
import { sitePath, useCmsSites } from '../site';
import { useMakeDefaultSite } from './useMakeDefaultSite';
import { DomainsDnsPanel } from '../dns';

/** Website › Websites: every site the CMS serves, with its domains and which one is default. */
export function WebsitesPage() {
  const t = useT();
  const navigate = useNavigate();
  const { formatDate } = useSettings();
  const { sites, loading, refetch } = useCmsSites();
  const [deleteSite] = useDeleteCmsSiteMutation();
  const makeDefault = useMakeDefaultSite(refetch);
  const crud = useCrudResource<CmsSiteRow>({
    label: 'Website',
    onDelete: (row) => deleteSite({ variables: { id: row.id } }),
    confirmMessage: (row) => ({
      message: 'Delete the website {name}? Its pages, fragments and media stay in the database.',
      values: { name: row.name },
    }),
    refetch,
  });

  const rows = [...sites];
  const stats: StatItem[] = [
    { label: 'Websites', value: String(rows.length), accent: color.blue[400] },
    {
      label: 'Active',
      value: String(rows.filter((row) => row.status === 'ACTIVE').length),
      accent: color.green[300],
    },
    {
      label: 'Domains',
      value: String(rows.reduce((sum, row) => sum + row.domains.length, 0)),
      accent: color.orange[500],
    },
  ];

  const columns: Column<CmsSiteRow>[] = [
    { key: 'name', label: 'Name' },
    { key: 'slug', label: 'Key' },
    { key: 'domains', label: 'Domains', render: (row) => row.domains.join(', ') || '—' },
    { key: 'status', label: 'Status', render: (row) => <StatusChip value={row.status} /> },
    {
      key: 'isDefault',
      label: 'Default',
      render: (row) =>
        row.isDefault ? <Chip size="small" color="primary" label={t('Default')} /> : '',
    },
    { key: 'markets', label: 'Markets', render: (row) => (row.markets ? t('Yes') : t('No')) },
    { key: 'updatedAt', label: 'Updated', render: (row) => formatDate(row.updatedAt) },
  ];

  if (crud.open) {
    return (
      <CrudFormPage
        title={crud.editing ? 'Edit website' : 'New website'}
        onBack={crud.close}
        backLabel="Back to Websites"
      >
        <CmsSiteForm initial={crud.editing} onCancel={crud.close} onDone={crud.onDone} />
        {crud.editing && <DomainsDnsPanel siteId={crud.editing.id} />}
      </CrudFormPage>
    );
  }

  return (
    <ModuleDashboard
      title="Websites"
      subtitle="The sites the CMS serves, their domains and the default site"
      actionLabel="New website"
      onAction={crud.openCreate}
      stats={stats}
      statsLoading={loading && rows.length === 0}
    >
      <DataTable
        columns={columns}
        rows={rows}
        onEdit={crud.openEdit}
        onDelete={crud.remove}
        onRowClick={(row) => navigate(sitePath(row.slug))}
        actions={[
          {
            icon: <LaunchIcon fontSize="small" />,
            tooltip: 'Open',
            ariaLabel: 'Open website',
            onClick: (row) => navigate(sitePath(row.slug, 'pages')),
          },
          {
            icon: <StarIcon fontSize="small" />,
            tooltip: 'Make default',
            ariaLabel: 'Make default website',
            hidden: (row) => row.isDefault,
            onClick: makeDefault,
          },
        ]}
        emptyMessage="No websites yet."
        loading={loading && rows.length === 0}
        onRefresh={refetch}
      />
    </ModuleDashboard>
  );
}
