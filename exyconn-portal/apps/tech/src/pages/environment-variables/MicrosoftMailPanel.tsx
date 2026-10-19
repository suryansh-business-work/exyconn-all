import { useT } from '@exyconn/i18n';
import { Alert, Box, Button, Skeleton, Typography } from '@exyconn/shell/components/ui';
import { panel } from '@exyconn/shell/components/glass/glass';
import { errorMessage } from '@exyconn/shell/utils/errorMessage';
import { portalLogger } from '@exyconn/shell/logging/portalLogger';
import { useMicrosoftMailConfigQuery } from '@exyconn/shell/graphql/generated';
import { MicrosoftMailConfigForm } from './forms/microsoft-mail-config';
import { MicrosoftMailConnection } from './MicrosoftMailConnection';
import { RedirectUriInfo } from './RedirectUriInfo';

/**
 * Environment Variables > Microsoft Mail: the Microsoft Entra app the CRM's Outlook / Microsoft
 * 365 mailboxes connect through. The mailboxes themselves are connected in CRM > Integrations.
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
        {t('Microsoft Mail')}
      </Typography>
      <MicrosoftMailConnection accountCount={config.accountCount} />
      <RedirectUriInfo uri={config.redirectUri} />
      <MicrosoftMailConfigForm key={config.updatedAt ?? 'new'} initial={config} />
    </Box>
  );
}
