import { useT } from '@exyconn/i18n';
import { Alert, Box, Button, Link, Stack } from '@exyconn/shell/components/ui';
import { PanelSkeleton } from '@exyconn/shell/components/feedback/skeletons';
import { readingPanel } from '@exyconn/shell/components/glass/glass';
import { PageHeader } from '@exyconn/shell/components/layout/PageHeader';
import { EmptyState } from '@exyconn/shell/components/feedback/EmptyState';
import { appUrl } from '@exyconn/shell/config/apps';
import { errorMessage } from '@exyconn/shell/utils/errorMessage';
import { portalLogger } from '@exyconn/shell/logging/portalLogger';
import { useGmailAccountsQuery } from '@exyconn/shell/graphql/generated';
import { GmailAccountCard } from './GmailAccountCard';
import { useGmailAccountActions } from './useGmailAccountActions';

/** Where Tech saves the Google OAuth client the accounts connect through. */
const TECH_GMAIL_PATH = '/tech/environment-variables/gmail';

const logFailure = (error: unknown) =>
  portalLogger.warn('crm: Gmail accounts action failed', error);

/** Tech has not saved the Google client yet, so nothing can connect. */
function ClientMissing() {
  const t = useT();
  return (
    <Alert severity="info">
      {t('Gmail is not set up yet. Ask Tech to save the Google client in')}{' '}
      <Link href={appUrl('tech', TECH_GMAIL_PATH)}>
        {t('Tech > Environment Variables > Gmail')}
      </Link>
      .
    </Alert>
  );
}

/**
 * CRM > Configuration > Connect Gmail: every mailbox the CRM reads contacts' and companies'
 * threads from and sends as. Several may be connected; each one is turned on or off for the CRM.
 */
export function GmailAccountsPage() {
  const t = useT();
  const actions = useGmailAccountActions();
  const { data, loading, error, refetch } = useGmailAccountsQuery({
    fetchPolicy: 'cache-and-network',
  });
  const accounts = data?.gmailAccounts ?? [];
  const clientReady = data?.gmailClientReady ?? false;
  const connect = () => {
    actions.connect().catch(logFailure);
  };

  let body;
  if (error && !data) {
    const retry = () => {
      refetch().catch(logFailure);
    };
    body = (
      <Alert
        severity="error"
        action={
          <Button color="inherit" size="small" onClick={retry}>
            {t('Retry')}
          </Button>
        }
      >
        {errorMessage(error, t('Could not load the Gmail accounts.'))}
      </Alert>
    );
  } else if (loading && !data) {
    body = <PanelSkeleton lines={3} label="Loading the Gmail accounts" />;
  } else if (accounts.length === 0) {
    body = (
      <EmptyState
        title="No Gmail account connected"
        description="Connect a Gmail account to email contacts and companies from their pages and see every thread with them."
        actionLabel={clientReady ? 'Connect Gmail' : undefined}
        onAction={clientReady ? connect : undefined}
      />
    );
  } else {
    body = accounts.map((account) => (
      <GmailAccountCard key={account.id} account={account} actions={actions} />
    ));
  }

  return (
    <Box>
      <PageHeader
        title="Connect Gmail"
        subtitle="The Gmail accounts the CRM sends from and reads contacts' and companies' threads in"
      >
        <Button
          variant="contained"
          onClick={connect}
          loading={actions.connecting}
          disabled={!clientReady}
        >
          {accounts.length > 0 ? t('Connect another Gmail') : t('Connect Gmail')}
        </Button>
      </PageHeader>
      <Stack spacing={2} sx={readingPanel}>
        {data && !clientReady && <ClientMissing />}
        {body}
      </Stack>
    </Box>
  );
}
