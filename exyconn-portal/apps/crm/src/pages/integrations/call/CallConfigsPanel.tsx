import type { Column } from '@exyconn/shell/components/data/DataTable';
import { StatusChip } from '@exyconn/shell/components/data/StatusChip';
import {
  CrmIntegrationStatusDocument,
  useCrmCallConfigsQuery,
  useCrmIntegrationStatusQuery,
  useDeleteCrmCallConfigMutation,
  useTestCrmCallConfigMutation,
} from '@exyconn/shell/graphql/generated';
import { maskedToken } from '../forms/secret';
import { CrmCallConfigForm, type CrmCallConfigRow } from '../forms/crm-call-config';
import { ChannelConfigsPanel } from '../ChannelConfigsPanel';
import { ProviderLabel } from '@exyconn/shell/components/mailboxes';

const COLUMNS: Column<CrmCallConfigRow>[] = [
  { key: 'label', label: 'Label' },
  { key: 'provider', label: 'Provider', render: (r) => <ProviderLabel provider={r.provider} /> },
  { key: 'fromNumber', label: 'From number' },
  {
    key: 'hasAuthToken',
    label: 'Auth token',
    render: (r) => maskedToken(r.hasAuthToken, r.authTokenHint),
  },
  {
    key: 'isActive',
    label: 'Active',
    render: (r) => <StatusChip value={r.isActive ? 'ACTIVE' : 'INACTIVE'} />,
  },
];

/** CRM > Integrations > Call: the Twilio or Vobiz account click-to-call rings through. */
export function CallConfigsPanel() {
  const { data, loading, refetch } = useCrmCallConfigsQuery();
  const { data: status } = useCrmIntegrationStatusQuery();
  const [deleteConfig] = useDeleteCrmCallConfigMutation({
    refetchQueries: [CrmIntegrationStatusDocument],
  });
  const [testConfig] = useTestCrmCallConfigMutation();
  return (
    <ChannelConfigsPanel
      title="Call"
      subtitle="Click-to-call from contacts and companies: your phone rings first, then the call connects to the contact"
      noun="call account"
      status={status?.crmIntegrationStatus.call}
      hint="Add an active Twilio or Vobiz account to call from record pages."
      emptyMessage="No call account yet: the Call button on records is off."
      deleteMessage='Delete call account "{label}"? Calls from records stop until another one is active.'
      columns={COLUMNS}
      rows={data?.crmCallConfigs ?? []}
      loading={loading}
      refetch={refetch}
      onDelete={(row) => deleteConfig({ variables: { id: row.id } })}
      onTest={async (id) => (await testConfig({ variables: { id } })).data?.testCrmCallConfig}
      renderForm={(handlers) => <CrmCallConfigForm {...handlers} />}
    />
  );
}
