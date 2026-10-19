import { useT } from '@exyconn/i18n';
import { Alert, Box, Stack } from '@exyconn/shell/components/ui';
import { PageHeader } from '@exyconn/shell/components/layout/PageHeader';
import { useCrmIntegrationStatusQuery } from '@exyconn/shell/graphql/generated';
import { GmailCard } from './GmailCard';
import { MicrosoftMailCard } from './MicrosoftMailCard';

/** CRM > Integrations > Email: the Gmail and Microsoft mailboxes CRM emails go out from. */
export function EmailIntegrationsPanel() {
  const t = useT();
  const { data } = useCrmIntegrationStatusQuery({ fetchPolicy: 'cache-and-network' });
  return (
    <Box>
      <PageHeader
        title="Email"
        subtitle="The mailboxes the CRM emails contacts and companies from"
      />
      <Stack spacing={2}>
        <Alert severity="info">
          {t(
            'Email connections are available on the operator’s CRM only. Other companies’ CRMs cannot connect or send from a mailbox.',
          )}
        </Alert>
        <GmailCard ready={data?.crmIntegrationStatus.email.gmail ?? false} />
        <MicrosoftMailCard />
      </Stack>
    </Box>
  );
}
