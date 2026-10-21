import { Box, Stack } from '@exyconn/shell/components/ui';
import { PageHeader } from '@exyconn/shell/components/layout/PageHeader';
import { useCrmIntegrationStatusQuery } from '@exyconn/shell/graphql/generated';
import { GmailCard } from './GmailCard';
import { MicrosoftMailCard } from './MicrosoftMailCard';

/** CRM > Integrations > Email: the company's own Gmail and Microsoft mailboxes CRM emails go out from. */
export function EmailIntegrationsPanel() {
  const { data } = useCrmIntegrationStatusQuery({ fetchPolicy: 'cache-and-network' });
  const email = data?.crmIntegrationStatus.email;
  return (
    <Box>
      <PageHeader
        title="Email"
        subtitle="The mailboxes the CRM emails contacts and companies from"
      />
      <Stack spacing={2}>
        <GmailCard ready={email?.gmail ?? false} />
        <MicrosoftMailCard ready={email?.microsoft ?? false} />
      </Stack>
    </Box>
  );
}
