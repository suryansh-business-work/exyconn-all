import { useT } from '@exyconn/i18n';
import { Alert, Box, Button, Skeleton, Typography } from '@exyconn/shell/components/ui';
import { panel } from '@exyconn/shell/components/glass/glass';
import { errorMessage } from '@exyconn/shell/utils/errorMessage';
import { portalLogger } from '@exyconn/shell/logging/portalLogger';
import { useMicrosoftMailConfigQuery } from '@exyconn/shell/graphql/generated';
import { MicrosoftMailConfigForm } from './forms/microsoft-mail-config';
import { MicrosoftMailConnection } from './MicrosoftMailConnection';
import { RedirectUriInfo } from './RedirectUriInfo';

/** What the Entra app needs besides the redirect URI. */
const ENTRA_INSTRUCTIONS =
  'Register this exact address as a Web redirect URI on the Entra app (Authentication > Add a platform > Web), and grant it the Mail.Send, User.Read and offline_access delegated permissions:';

/**
 * Environment Variables > Email accounts > Microsoft OAuth app: the Microsoft Entra app the CRM's
 * Outlook / Microsoft 365 mailboxes connect through. The mailboxes themselves are connected in
 * CRM > Integrations.
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
      <MicrosoftMailConnection accountCount={config.accountCount} />
      <RedirectUriInfo uri={config.redirectUri} instructions={ENTRA_INSTRUCTIONS} />
      <MicrosoftMailConfigForm key={config.updatedAt ?? 'new'} initial={config} />
    </Box>
  );
}
