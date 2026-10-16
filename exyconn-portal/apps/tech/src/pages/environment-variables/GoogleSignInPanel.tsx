import { useT } from '@exyconn/i18n';
import { Alert, Box, Button, Skeleton, Stack, Typography } from '@exyconn/shell/components/ui';
import { panel } from '@exyconn/shell/components/glass/glass';
import { useNotify } from '@exyconn/shell/components/feedback/NotificationProvider';
import { errorMessage } from '@exyconn/shell/utils/errorMessage';
import { portalLogger } from '@exyconn/shell/logging/portalLogger';
import {
  useGoogleSignInConfigQuery,
  useTestGoogleSignInConfigMutation,
} from '@exyconn/shell/graphql/generated';
import { GoogleSignInConfigForm } from './forms/google-sign-in-config';

/** Asks Google whether it knows the saved client ID and secret, and says what it answered. */
function TestButton({ disabled }: Readonly<{ disabled: boolean }>) {
  const t = useT();
  const notify = useNotify();
  const [test, { loading }] = useTestGoogleSignInConfigMutation();
  const onTest = async () => {
    try {
      const { data } = await test();
      notify(data?.testGoogleSignInConfig ?? 'Google answered', 'success');
    } catch (error) {
      portalLogger.warn('tech: testing Google sign-in failed', error);
      notify(errorMessage(error, 'The Google sign-in test failed'), 'error');
    }
  };
  return (
    <Button variant="outlined" onClick={onTest} loading={loading} disabled={disabled}>
      {t('Test')}
    </Button>
  );
}

/**
 * Environment Variables > Google sign-in: the Google OAuth client behind "Continue with Google"
 * on the portal sign-in page. It signs in people who already have an account, by the email
 * Google has verified; it never creates one.
 */
export function GoogleSignInPanel() {
  const t = useT();
  const { data, error, refetch } = useGoogleSignInConfigQuery({ fetchPolicy: 'cache-and-network' });
  const config = data?.googleSignInConfig;

  if (error) {
    const retry = () => {
      refetch().catch((retryError: unknown) =>
        portalLogger.warn('tech: reloading Google sign-in failed', retryError),
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
        {t('Could not load Google sign-in.')} {errorMessage(error, t('The server did not answer.'))}
      </Alert>
    );
  }
  if (!config) {
    return <Skeleton variant="rounded" height={320} aria-busy />;
  }
  return (
    <Box sx={panel} component="section" aria-labelledby="google-sign-in-title">
      <Stack
        direction="row"
        spacing={2}
        sx={{ mb: 2, alignItems: 'center', justifyContent: 'space-between' }}
      >
        <Typography id="google-sign-in-title" variant="h6" component="h2">
          {t('Google sign-in')}
        </Typography>
        <TestButton disabled={!config.clientId || !config.hasClientSecret} />
      </Stack>
      <Alert severity="info" sx={{ mb: 2 }}>
        {t('Add this as an authorised redirect URI on the Google OAuth client:')}{' '}
        <strong>{config.redirectUri}</strong>
      </Alert>
      <GoogleSignInConfigForm key={config.updatedAt ?? 'new'} initial={config} />
    </Box>
  );
}
