import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import DesignServicesIcon from '@mui/icons-material/DesignServices';
import PublishIcon from '@mui/icons-material/Publish';
import { useT } from '@exyconn/i18n';
import { DataTable, type Column } from '@exyconn/shell/components/data/DataTable';
import { StatusChip } from '@exyconn/shell/components/data/StatusChip';
import { CrudFormPage } from '@exyconn/shell/components/data/CrudFormPage';
import { ModuleDashboard } from '@exyconn/shell/components/dashboard/ModuleDashboard';
import type { StatItem } from '@exyconn/shell/components/dashboard/StatCard';
import { MenuItem, TextField, color } from '@exyconn/shell/components/ui';
import { useCrudResource } from '@exyconn/crud';
import { useSettings } from '@exyconn/shell/hooks/useSettings';
import {
  useCmsFragmentsQuery,
  useDeleteCmsFragmentMutation,
} from '@exyconn/shell/graphql/generated';
import { CmsFragmentForm, type CmsFragmentRow } from '../../website/forms/cms-fragment';
import { FRAGMENT_KIND_OPTIONS } from '../../website/forms/cms-fragment/cms-fragment.types';
import { useCurrentSite, useSitePath } from '../site';
import { useFragmentPublish } from './useFragmentPublish';

/** Shows the "any" option's text when nothing is filtered, with the label above it. */
const EMPTY_SHOWN = { inputLabel: { shrink: true }, select: { displayEmpty: true } };

/** Website › Fragments: headers, footers and sections placed into the site's pages. */
export function FragmentsPage() {
  const t = useT();
  const navigate = useNavigate();
  const to = useSitePath();
  const { site } = useCurrentSite();
  const { formatDate } = useSettings();
  const [kind, setKind] = useState('');
  const { data, loading, refetch } = useCmsFragmentsQuery({
    variables: { siteId: site.id },
    fetchPolicy: 'cache-and-network',
  });
  const [deleteFragment] = useDeleteCmsFragmentMutation();
  const publish = useFragmentPublish(refetch);
  const build = (id: string) => navigate(to(`fragments/${id}/edit`));
  const crud = useCrudResource<CmsFragmentRow>({
    label: 'Fragment',
    onDelete: (row) => deleteFragment({ variables: { id: row.id } }),
    confirmMessage: (row) => ({
      message: 'Delete the fragment {name}?',
      values: { name: row.name },
    }),
    refetch,
  });

  const all = data?.cmsFragments ?? [];
  const rows = kind ? all.filter((row) => row.kind === kind) : all;
  const stats: StatItem[] = [
    { label: 'Fragments', value: String(all.length), accent: color.blue[400] },
    {
      label: 'Unpublished changes',
      value: String(all.filter((row) => row.status !== 'PUBLISHED').length),
      accent: color.orange[500],
    },
  ];
  const columns: Column<CmsFragmentRow>[] = [
    { key: 'name', label: 'Name' },
    {
      key: 'kind',
      label: 'Kind',
      render: (row) => t(row.kind.charAt(0) + row.kind.slice(1).toLowerCase()),
    },
    { key: 'status', label: 'Status', render: (row) => <StatusChip value={row.status} /> },
    { key: 'updatedByName', label: 'Updated by', render: (row) => row.updatedByName || '—' },
    { key: 'updatedAt', label: 'Updated', render: (row) => formatDate(row.updatedAt) },
  ];

  if (crud.open) {
    return (
      <CrudFormPage
        title={crud.editing ? 'Edit fragment' : 'New fragment'}
        onBack={crud.close}
        backLabel="Back to Fragments"
      >
        <CmsFragmentForm
          siteId={site.id}
          initial={crud.editing}
          onCancel={crud.close}
          onDone={crud.onDone}
          onCreated={build}
        />
      </CrudFormPage>
    );
  }

  return (
    <ModuleDashboard
      title="Fragments"
      subtitle="Reusable headers, footers and sections of {site}"
      subtitleValues={{ site: site.name }}
      actionLabel="New fragment"
      onAction={crud.openCreate}
      stats={stats}
      statsLoading={!data && loading}
    >
      <TextField
        select
        size="small"
        slotProps={EMPTY_SHOWN}
        label={t('Kind')}
        value={kind}
        onChange={(event) => setKind(event.target.value)}
        sx={{ minWidth: 200, mb: 1.5 }}
      >
        <MenuItem value="">{t('Every kind')}</MenuItem>
        {FRAGMENT_KIND_OPTIONS.map((option) => (
          <MenuItem key={option.value} value={option.value}>
            {t(option.label)}
          </MenuItem>
        ))}
      </TextField>
      <DataTable
        columns={columns}
        rows={rows}
        onRowClick={(row) => build(row.id)}
        onEdit={crud.openEdit}
        onDelete={crud.remove}
        actions={[
          {
            icon: <DesignServicesIcon fontSize="small" />,
            tooltip: 'Edit in the builder',
            ariaLabel: 'Edit in the builder',
            onClick: (row) => build(row.id),
          },
          {
            icon: <PublishIcon fontSize="small" />,
            tooltip: 'Publish',
            ariaLabel: 'Publish fragment',
            color: 'success',
            hidden: (row) => row.status === 'PUBLISHED',
            onClick: publish,
          },
        ]}
        emptyMessage="No fragments yet."
        loading={!data && loading}
        onRefresh={refetch}
      />
    </ModuleDashboard>
  );
}
