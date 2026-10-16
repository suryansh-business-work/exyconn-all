import { useT } from '@exyconn/i18n';
import { Alert, Box, Button, Skeleton, Typography } from '@exyconn/shell/components/ui';
import { panel } from '@exyconn/shell/components/glass/glass';
import { errorMessage } from '@exyconn/shell/utils/errorMessage';
import { portalLogger } from '@exyconn/shell/logging/portalLogger';
import { useGmailConfigQuery } from '@exyconn/shell/graphql/generated';
import { GmailConfigForm } from './forms/gmail-config';
import { GmailConnection } from './GmailConnection';

/**
 * Environment Variables > Gmail: the Google OAuth client (Gmail API enabled) the CRM's Gmail
 * accounts connect through. The accounts themselves are connected in CRM > Connect Gmail.
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
        {t('Gmail')}
      </Typography>
      <GmailConnection config={config} />
      <Alert severity="info" sx={{ mb: 2 }}>
        {t('Add this as an authorised redirect URI on the Google OAuth client:')}{' '}
        <strong>{config.redirectUri}</strong>
      </Alert>
      <GmailConfigForm key={config.updatedAt ?? 'new'} initial={config} />
    </Box>
  );
}
