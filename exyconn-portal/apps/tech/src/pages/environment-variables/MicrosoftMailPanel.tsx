import { useT } from '@exyconn/i18n';
import { Alert, Box, Button, Skeleton, Typography } from '@exyconn/shell/components/ui';
import { panel } from '@exyconn/shell/components/glass/glass';
import { errorMessage } from '@exyconn/shell/utils/errorMessage';
import { portalLogger } from '@exyconn/shell/logging/portalLogger';
import { useMicrosoftMailConfigQuery } from '@exyconn/shell/graphql/generated';
import { MicrosoftMailConfigForm } from './forms/microsoft-mail-config';
import { MicrosoftMailConnection } from './MicrosoftMailConnection';
import { ConnectionsOffNotice } from './ConnectionsOffNotice';
import { RedirectUriInfo } from './RedirectUriInfo';

/** Why every CRM's Connect Microsoft account button is off while the app is switched off. */
const MICROSOFT_OFF =
  'Microsoft connections are switched off. Every company’s Connect Microsoft account button stays disabled until the switch below is on and saved.';

/** What the Entra app needs besides the redirect URI. */
const ENTRA_INSTRUCTIONS =
  'Register this exact address as a Web redirect URI on the Entra app (Authentication > Add a platform > Web), and grant it the Mail.Send, User.Read and offline_access delegated permissions:';

/**
 * Environment Variables > Email accounts > Microsoft OAuth app: the Microsoft Entra app every
 * company's CRM Outlook / Microsoft 365 mailboxes connect through. Each company connects its own
 * mailboxes in CRM > Integrations.
 */
export function MicrosoftMailPanel() {
  const t = useT();
  const { data, error, refetch } = useMicrosoftMailConfigQuery({
    fetchPolicy: 'cache-and-network',
  });
  const config = data?.microsoftMailConfig;
  if (error && !config) {
    const retry = () => {
      refetch().catch((retryError: unknown) =>
        portalLogger.warn('tech: reloading Microsoft Mail failed', retryError),
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
        {t('Could not load Microsoft Mail.')} {errorMessage(error, t('The server did not answer.'))}
      </Alert>
    );
  }
  if (!config) {
    return <Skeleton variant="rounded" height={320} aria-busy />;
  }
  return (
    <Box sx={panel} component="section" aria-labelledby="microsoft-mail-title">
      <Typography id="microsoft-mail-title" variant="h6" component="h2" sx={{ mb: 2 }}>
        {t('Microsoft OAuth app')}
      </Typography>
      {config.enabled ? null : <ConnectionsOffNotice message={MICROSOFT_OFF} />}
      <MicrosoftMailConnection accountCount={config.accountCount} />
      <RedirectUriInfo uri={config.redirectUri} instructions={ENTRA_INSTRUCTIONS} />
      <MicrosoftMailConfigForm key={config.updatedAt ?? 'new'} initial={config} />
    </Box>
  );
}
