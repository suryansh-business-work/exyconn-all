import { useT } from '@exyconn/i18n';
import { Alert, Box, Button, Skeleton, Typography } from '@exyconn/shell/components/ui';
import { panel } from '@exyconn/shell/components/glass/glass';
import { errorMessage } from '@exyconn/shell/utils/errorMessage';
import { portalLogger } from '@exyconn/shell/logging/portalLogger';
import { useGmailConfigQuery } from '@exyconn/shell/graphql/generated';
import { GmailConfigForm } from './forms/gmail-config';
import { GmailConnection } from './GmailConnection';
import { ConnectionsOffNotice } from './ConnectionsOffNotice';
import { RedirectUriInfo } from './RedirectUriInfo';
import { UseGoogleClientButton } from './UseGoogleClientButton';

/** Why every CRM's Connect Gmail account button is off while the client is switched off. */
const GOOGLE_OFF =
  'Gmail connections are switched off. Every company’s Connect Gmail account button stays disabled until the switch below is on and saved.';

/** What the Google client needs besides the redirect URI. */
const GOOGLE_INSTRUCTIONS =
  'Add this exact address as an authorised redirect URI on the Google OAuth client, and enable the Gmail API on its project:';

/**
 * Environment Variables > Email accounts > Google OAuth app: the Google OAuth client (Gmail API
 * enabled) every company's CRM Gmail accounts connect through. Each company connects its own
 * accounts in CRM > Integrations.
 */
export function GmailPanel() {
  const t = useT();
  const { data, error, refetch } = useGmailConfigQuery({ fetchPolicy: 'cache-and-network' });
  const config = data?.gmailConfig;
  if (error && !config) {
    const retry = () => {
      refetch().catch((retryError: unknown) =>
        portalLogger.warn('tech: reloading Gmail failed', retryError),
      );
    };
    return (
      <Alert
        severity="error"
        action={
          <Button color="inherit" size="small" onClick={retry}>
            {t('Retry')}
          </Button>
        }
      >
        {t('Could not load Gmail.')} {errorMessage(error, t('The server did not answer.'))}
      </Alert>
    );
  }
  if (!config) {
    return <Skeleton variant="rounded" height={320} aria-busy />;
  }
  return (
    <Box sx={panel} component="section" aria-labelledby="gmail-title">
      <Typography id="gmail-title" variant="h6" component="h2" sx={{ mb: 2 }}>
        {t('Google OAuth app')}
      </Typography>
      {config.enabled ? null : <ConnectionsOffNotice message={GOOGLE_OFF} />}
      <GmailConnection config={config} />
      <UseGoogleClientButton />
      <RedirectUriInfo uri={config.redirectUri} instructions={GOOGLE_INSTRUCTIONS} />
      <GmailConfigForm key={config.updatedAt ?? 'new'} initial={config} />
    </Box>
  );
}
