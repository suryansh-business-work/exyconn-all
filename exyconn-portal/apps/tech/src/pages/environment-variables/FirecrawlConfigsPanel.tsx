import { useT } from '@exyconn/i18n';
import { Box } from '@exyconn/shell/components/ui';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { DataTable, type Column, type RowAction } from '@exyconn/shell/components/data/DataTable';
import { StatusChip } from '@exyconn/shell/components/data/StatusChip';
import { CrudFormPage } from '@exyconn/shell/components/data/CrudFormPage';
import { PageHeader } from '@exyconn/shell/components/layout/PageHeader';
import { useNotify } from '@exyconn/shell/components/feedback/NotificationProvider';
import { useCrudResource } from '@exyconn/crud';
import {
  useDeleteFirecrawlConfigMutation,
  useFirecrawlConfigsQuery,
  useTestFirecrawlConfigMutation,
} from '@exyconn/shell/graphql/generated';
import { maskedSecret } from './secret';
import {
  FirecrawlConfigForm,
  isHostedFirecrawl,
  type FirecrawlConfigRow,
} from './forms/firecrawl-config';

/** A self-hosted Firecrawl without authentication has no key and still runs. */
const isKeylessSelfHosted = (row: FirecrawlConfigRow) =>
  !row.hasApiKey && !isHostedFirecrawl(row.baseUrl);

/** The stored key, masked, or a note that a self-hosted install needs none. */
function ApiKeyCell({ row }: Readonly<{ row: FirecrawlConfigRow }>) {
  const t = useT();
  if (isKeylessSelfHosted(row)) {
    return <>{t('No key (self-hosted)')}</>;
  }
  return <>{maskedSecret(row.hasApiKey, row.apiKeyHint)}</>;
}

const COLUMNS: Column<FirecrawlConfigRow>[] = [
  { key: 'label', label: 'Label' },
  { key: 'baseUrl', label: 'Base URL' },
  {
    key: 'hasApiKey',
    label: 'API key',
    render: (r) => <ApiKeyCell row={r} />,
  },
  {
    key: 'isActive',
    label: 'Active',
    render: (r) => <StatusChip value={r.isActive ? 'ACTIVE' : 'INACTIVE'} />,
  },
];

/**
 * Environment Variables > Firecrawl: the install behind CRM > Tools > Website scraper. Firecrawl's
 * hosted API (firecrawl.dev) or a self-hosted Firecrawl, chosen by the base URL.
 */
export function FirecrawlConfigsPanel() {
  const notify = useNotify();
  const { data, loading, refetch } = useFirecrawlConfigsQuery();
  const [deleteConfig] = useDeleteFirecrawlConfigMutation();
  const [testConfig] = useTestFirecrawlConfigMutation();
  const crud = useCrudResource<FirecrawlConfigRow>({
    label: 'Firecrawl config',
    onDelete: (row) => deleteConfig({ variables: { id: row.id } }),
    confirmMessage: (row) => ({
      message: 'Delete Firecrawl config "{label}"?',
      values: { label: row.label },
    }),
    refetch,
  });

  const test = async (row: FirecrawlConfigRow) => {
    try {
      const { data: result } = await testConfig({ variables: { id: row.id } });
      notify(result?.testFirecrawlConfig ?? 'Firecrawl accepted the key', 'success');
    } catch (err) {
      notify(err instanceof Error ? err.message : 'Connection failed', 'error');
    }
  };

  const actions: RowAction<FirecrawlConfigRow>[] = [
    {
      icon: <CheckCircleIcon fontSize="small" />,
      tooltip: 'Test Firecrawl',
      ariaLabel: 'test firecrawl',
      color: 'primary',
      hidden: (row) => !row.hasApiKey && isHostedFirecrawl(row.baseUrl),
      onClick: test,
    },
  ];

  if (crud.open) {
    const title = crud.editing ? 'Edit Firecrawl config' : 'New Firecrawl config';
    return (
      <CrudFormPage title={title} onBack={crud.close} backLabel="Back to Firecrawl">
        <FirecrawlConfigForm initial={crud.editing} onCancel={crud.close} onDone={crud.onDone} />
      </CrudFormPage>
    );
  }

  return (
    <Box>
      <PageHeader
        title="Firecrawl"
        subtitle="Reads web pages for the CRM website scraper. Get a key at firecrawl.dev, or point the base URL at a self-hosted Firecrawl (no key needed without authentication)."
        actionLabel="New Firecrawl config"
        onAction={crud.openCreate}
      />
      <DataTable
        columns={COLUMNS}
        rows={data?.firecrawlConfigs ?? []}
        actions={actions}
        onEdit={crud.openEdit}
        onDelete={crud.remove}
        emptyMessage="No Firecrawl config yet: the CRM website scraper is off."
        loading={loading}
        onRefresh={refetch}
      />
    </Box>
  );
}
