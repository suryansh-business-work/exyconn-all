import { Box } from '@exyconn/shell/components/ui';
import { PageHeader } from '@exyconn/shell/components/layout/PageHeader';
import { WebhooksPanel } from './WebhooksPanel';

/** Developers › Webhooks: the endpoints this portal posts signed events to. */
export function WebhooksPage() {
  return (
    <Box>
      <PageHeader
        title="Webhooks"
        subtitle="Endpoints that receive signed event payloads — see the event catalogue for what each event carries"
      />
      <WebhooksPanel />
    </Box>
  );
}
