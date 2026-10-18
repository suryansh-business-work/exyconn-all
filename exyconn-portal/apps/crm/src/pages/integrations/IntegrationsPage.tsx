import { Box } from '@exyconn/shell/components/ui';
import { readingPanel } from '@exyconn/shell/components/glass/glass';
import { Tabber, type TabberItem } from '@exyconn/tabber';
import { CallConfigsPanel } from './call/CallConfigsPanel';
import { SmsConfigsPanel } from './sms/SmsConfigsPanel';
import { EmailIntegrationsPanel } from './email/EmailIntegrationsPanel';

export const INTEGRATIONS_PATH = '/integrations';

const TABS: TabberItem[] = [
  { slug: 'call', label: 'Call', content: <CallConfigsPanel /> },
  { slug: 'sms', label: 'SMS', content: <SmsConfigsPanel /> },
  { slug: 'email', label: 'Email', content: <EmailIntegrationsPanel /> },
];

/**
 * CRM > Integrations: the company's calling and SMS accounts and the mailboxes the CRM emails
 * from. Once a channel is connected, its button on contact and company pages turns on.
 */
export function IntegrationsPage() {
  return (
    <Box sx={readingPanel}>
      <Tabber basePath={INTEGRATIONS_PATH} items={TABS} ariaLabel="Integrations" />
    </Box>
  );
}
