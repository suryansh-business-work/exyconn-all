import { useT } from '@exyconn/i18n';
import { Alert, Box, Button, Skeleton, Typography } from '@exyconn/shell/components/ui';
import { panel } from '@exyconn/shell/components/glass/glass';
import { errorMessage } from '@exyconn/shell/utils/errorMessage';
import { portalLogger } from '@exyconn/shell/logging/portalLogger';
import { useGmailConfigQuery } from '@exyconn/shell/graphql/generated';
import { GmailConfigForm } from './forms/gmail-config';
import { GmailConnection } from './GmailConnection';
import { RedirectUriInfo } from './RedirectUriInfo';

/** What the Google client needs besides the redirect URI. */
const GOOGLE_INSTRUCTIONS =
  'Add this exact address as an authorised redirect URI on the Google OAuth client, and enable the Gmail API on its project:';

/**
 * Environment Variables > Email accounts > Google OAuth app: the Google OAuth client (Gmail API
 * enabled) the CRM's Gmail accounts connect through. The accounts themselves are connected in
 * CRM > Integrations.
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
      <GmailConnection config={config} />
      <RedirectUriInfo uri={config.redirectUri} instructions={GOOGLE_INSTRUCTIONS} />
      <GmailConfigForm key={config.updatedAt ?? 'new'} initial={config} />
    </Box>
  );
}
