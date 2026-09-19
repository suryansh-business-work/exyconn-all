import { useState } from 'react';
import EditIcon from '@mui/icons-material/Edit';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { Box } from '@exyconn/shell/components/ui';
import { DataTable, type Column, type RowAction } from '@exyconn/shell/components/data/DataTable';
import { StatusChip } from '@exyconn/shell/components/data/StatusChip';
import { CrudFormPage } from '@exyconn/shell/components/data/CrudFormPage';
import { PageHeader } from '@exyconn/shell/components/layout/PageHeader';
import { useNotify } from '@exyconn/shell/components/feedback/NotificationProvider';
import { errorMessage } from '@exyconn/shell/utils/errorMessage';
import {
  useSocialAppConfigsQuery,
  useTestSocialAppConfigMutation,
} from '@exyconn/shell/graphql/generated';
import { portalLogger } from '@exyconn/shell/logging/portalLogger';
import { SocialAppForm, type SocialAppRow } from './forms/social-app';
import { maskedSecret } from './secret';

/**
 * Environment Variables sub-panel: the OAuth app for each social network. One set for the
 * whole install — every company's Marketing connects its own accounts through these.
 */
export function SocialAppsPanel() {
  const { data, loading, refetch } = useSocialAppConfigsQuery();
  const [editing, setEditing] = useState<SocialAppRow | null>(null);
  const [testConfig] = useTestSocialAppConfigMutation();
  const notify = useNotify();

  /** Asks the provider whether it recognises the stored client ID and secret. */
  const test = async (row: SocialAppRow) => {
    try {
      const { data } = await testConfig({ variables: { app: row.app } });
      const result = data?.testSocialAppConfig;
      notify(result?.message ?? 'No answer from the provider', result?.ok ? 'success' : 'error');
    } catch (error) {
      notify(errorMessage(error, 'The test could not run'), 'error');
    }
  };
  const rows = data?.socialAppConfigs ?? [];

  const columns: Column<SocialAppRow>[] = [
    { key: 'label', label: 'Provider' },
    { key: 'clientId', label: 'Client ID', render: (r) => r.clientId || '—' },
    {
      key: 'clientSecret',
      label: 'Client secret',
      render: (r) => maskedSecret(r.hasClientSecret, r.clientSecretHint),
    },
    {
      key: 'enabled',
      label: 'Status',
      render: (r) => <StatusChip value={r.enabled ? 'ACTIVE' : 'INACTIVE'} />,
    },
  ];
  const actions: RowAction<SocialAppRow>[] = [
    {
      icon: <CheckCircleIcon fontSize="small" />,
      tooltip: 'Test connection',
      ariaLabel: 'test social app connection',
      color: 'primary',
      onClick: (row) => {
        test(row).catch((error: unknown) =>
          portalLogger.error('Testing a social app failed', error),
        );
      },
      hidden: (row) => !row.clientId || !row.hasClientSecret,
    },
    {
      icon: <EditIcon fontSize="small" />,
      tooltip: 'Set up',
      ariaLabel: 'set up social app',
      onClick: setEditing,
    },
  ];

  if (editing) {
    return (
      <CrudFormPage
        title="Set up {provider}"
        titleValues={{ provider: editing.label }}
        onBack={() => setEditing(null)}
        backLabel="Back to Social apps"
      >
        <SocialAppForm
          row={editing}
          onCancel={() => setEditing(null)}
          onDone={() => {
            setEditing(null);
            refetch().catch((error: unknown) =>
              portalLogger.warn('Could not reload social apps', error),
            );
          }}
        />
      </CrudFormPage>
    );
  }

  return (
    <Box>
      <PageHeader
        title="Social apps"
        subtitle="The LinkedIn, Meta, X and Google apps Marketing connects accounts through. Set each one up once."
      />
      <DataTable
        columns={columns}
        rows={[...rows]}
        actions={actions}
        loading={loading}
        onRefresh={refetch}
        emptyMessage="No providers."
      />
    </Box>
  );
}
