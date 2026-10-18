import type { Column } from '@exyconn/shell/components/data/DataTable';
import { StatusChip } from '@exyconn/shell/components/data/StatusChip';
import {
  CrmIntegrationStatusDocument,
  CrmSmsProvider,
  useCrmIntegrationStatusQuery,
  useCrmSmsConfigsQuery,
  useDeleteCrmSmsConfigMutation,
  useTestCrmSmsConfigMutation,
} from '@exyconn/shell/graphql/generated';
import { maskedToken } from '../forms/secret';
import { CrmSmsConfigForm, type CrmSmsConfigRow } from '../forms/crm-sms-config';
import { ChannelConfigsPanel } from '../ChannelConfigsPanel';
import { ProviderLabel } from '../../../integrations/ProviderLogo';

const COLUMNS: Column<CrmSmsConfigRow>[] = [
  { key: 'label', label: 'Label' },
  { key: 'provider', label: 'Provider', render: (r) => <ProviderLabel provider={r.provider} /> },
  {
    key: 'fromNumber',
    label: 'Sends as',
    // Twilio sends from a number; MSG91 from its DLT sender id.
    render: (r) => (r.provider === CrmSmsProvider.Twilio ? r.fromNumber : r.senderId),
  },
  {
    key: 'hasAuthToken',
    label: 'Auth token / key',
    render: (r) => maskedToken(r.hasAuthToken, r.authTokenHint),
  },
  {
    key: 'isActive',
    label: 'Active',
    render: (r) => <StatusChip value={r.isActive ? 'ACTIVE' : 'INACTIVE'} />,
  },
];

/** CRM > Integrations > SMS: the Twilio or MSG91 account texts from records go through. */
export function SmsConfigsPanel() {
  const { data, loading, refetch } = useCrmSmsConfigsQuery();
  const { data: status } = useCrmIntegrationStatusQuery();
  const [deleteConfig] = useDeleteCrmSmsConfigMutation({
    refetchQueries: [CrmIntegrationStatusDocument],
  });
  const [testConfig] = useTestCrmSmsConfigMutation();
  return (
    <ChannelConfigsPanel
      title="SMS"
      subtitle="Text contacts and companies from their pages; every message is logged on the record's timeline"
      noun="SMS account"
      status={status?.crmIntegrationStatus.sms}
      hint="Add an active Twilio or MSG91 account to text from record pages."
      emptyMessage="No SMS account yet: the SMS button on records is off."
      deleteMessage='Delete SMS account "{label}"? Texts from records stop until another one is active.'
      columns={COLUMNS}
      rows={data?.crmSmsConfigs ?? []}
      loading={loading}
      refetch={refetch}
      onDelete={(row) => deleteConfig({ variables: { id: row.id } })}
      onTest={async (id) => (await testConfig({ variables: { id } })).data?.testCrmSmsConfig}
      renderForm={(handlers) => <CrmSmsConfigForm {...handlers} />}
    />
  );
}
