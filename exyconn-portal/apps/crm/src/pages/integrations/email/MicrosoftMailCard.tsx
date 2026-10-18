import { useT } from '@exyconn/i18n';
import { Alert, Box, Button, Flex, Link, Stack, Text } from '@exyconn/shell/components/ui';
import { panel } from '@exyconn/shell/components/glass/glass';
import { PanelSkeleton } from '@exyconn/shell/components/feedback/skeletons';
import { appUrl } from '@exyconn/shell/config/apps';
import { errorMessage } from '@exyconn/shell/utils/errorMessage';
import { portalLogger } from '@exyconn/shell/logging/portalLogger';
import { useMicrosoftMailAccountsQuery } from '@exyconn/shell/graphql/generated';
import { ProviderLogo } from '../../../integrations/ProviderLogo';
import { MicrosoftAccountCard } from './MicrosoftAccountCard';
import { useMicrosoftMailActions } from './useMicrosoftMailActions';

/** Where Tech saves the Microsoft Entra app the mailboxes connect through. */
const TECH_MICROSOFT_PATH = '/tech/environment-variables/microsoft-mail';

const logFailure = (error: unknown) =>
  portalLogger.warn('crm: Microsoft mailboxes action failed', error);

/** Tech has not saved the Entra app yet, so nothing can connect. */
function ClientMissing() {
  const t = useT();
  return (
    <Alert severity="info">
      {t('Microsoft mail is not set up yet. Ask Tech to add the Microsoft app in')}{' '}
      <Link href={appUrl('tech', TECH_MICROSOFT_PATH)}>
        {t('Tech > Environment Variables > Microsoft Mail')}
      </Link>
      .
    </Alert>
  );
}

/** The Microsoft (Outlook / Microsoft 365) mailboxes the CRM sends from. */
export function MicrosoftMailCard() {
  const t = useT();
  const actions = useMicrosoftMailActions();
  const { data, loading, error, refetch } = useMicrosoftMailAccountsQuery({
    fetchPolicy: 'cache-and-network',
  });
  const accounts = data?.microsoftMailAccounts ?? [];
  const clientReady = data?.microsoftMailClientReady ?? false;

  let body;
  if (error && !data) {
    body = (
      <Alert
        severity="error"
        action={
          <Button color="inherit" size="small" onClick={() => refetch().catch(logFailure)}>
            {t('Retry')}
          </Button>
        }
      >
        {errorMessage(error, t('Could not load the Microsoft mailboxes.'))}
      </Alert>
    );
  } else if (loading && !data) {
    body = <PanelSkeleton lines={2} label="Loading the Microsoft mailboxes" />;
  } else if (accounts.length === 0) {
    body = <Text color="text.secondary">{t('No Microsoft mailbox connected yet.')}</Text>;
  } else {
    body = (
      <Stack spacing={1.5}>
        {accounts.map((account) => (
          <MicrosoftAccountCard key={account.id} account={account} actions={actions} />
        ))}
      </Stack>
    );
  }

  return (
    <Box component="section" sx={panel} aria-labelledby="microsoft-mail-heading">
      <Flex direction="column" spacing={1.5}>
        <Flex direction="row" spacing={1} alignItems="center">
          <ProviderLogo provider="MICROSOFT" size={28} />
          <Text id="microsoft-mail-heading" component="h2" weight="semibold">
            {t('Microsoft (Outlook / Microsoft 365)')}
          </Text>
        </Flex>
        <Text size="sm" color="text.secondary">
          {t('Send CRM emails from Outlook or Microsoft 365 mailboxes.')}
        </Text>
        {data && !clientReady && <ClientMissing />}
        {body}
        <Box>
          <Button
            variant="contained"
            onClick={() => {
              actions.connect().catch(logFailure);
            }}
            loading={actions.connecting}
            disabled={!clientReady}
          >
            {t('Connect Microsoft account')}
          </Button>
        </Box>
      </Flex>
    </Box>
  );
}
