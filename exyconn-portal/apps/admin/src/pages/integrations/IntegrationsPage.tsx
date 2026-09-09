import { Box } from '@exyconn/shell/components/ui';
import { PageHeader } from '@exyconn/shell/components/layout/PageHeader';
import { Tabber, type TabberItem } from '@exyconn/tabber';
import KeyIcon from '@mui/icons-material/Key';
import WebhookIcon from '@mui/icons-material/Webhook';
import { ApiKeysPanel } from './ApiKeysPanel';
import { WebhooksPanel } from './WebhooksPanel';

/**
 * How other systems talk to this one, and how it talks back.
 *
 * Both halves are an administrator's business: a key is a way into everything its roles can
 * reach, and an endpoint is a copy of this portal's events leaving the building.
 */
export function IntegrationsPage() {
  const tabs: TabberItem[] = [
    { slug: 'api-keys', label: 'API keys', icon: <KeyIcon />, content: <ApiKeysPanel /> },
    { slug: 'webhooks', label: 'Webhooks', icon: <WebhookIcon />, content: <WebhooksPanel /> },
  ];

  return (
    <Box>
      <PageHeader
        title="Integrations"
        subtitle="Keys for machines that call us, and webhooks for systems we call"
      />
      <Tabber basePath="/admin/integrations" items={tabs} ariaLabel="Integration views" />
    </Box>
  );
}
