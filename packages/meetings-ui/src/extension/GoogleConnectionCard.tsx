import { useFormatters, useT } from '@exyconn/i18n';
import GoogleIcon from '@mui/icons-material/Google';
import LinkOffIcon from '@mui/icons-material/LinkOff';
import { Alert, Box, Button, Heading, Skeleton } from '@exyconn/shell/components/ui';
import { panel } from '@exyconn/shell/components/glass/glass';
import { useConfirm } from '@exyconn/shell/components/feedback/ConfirmProvider';
import {
  useMaDisconnectGoogleMutation,
  useMaGoogleConnectionQuery,
} from '@exyconn/shell/graphql/generated';
import { LoadError } from '../lib/LoadError';
import { useGoogleConnect } from '../lib/useGoogleConnect';
import { useRunNotified } from '../lib/useRunNotified';
import { GoogleConnectionStatus } from './GoogleConnectionStatus';

/**
 * The viewer's Google Meet connection, which lets the portal import Meet's own transcript and
 * participant list after a call (read-only scope).
 */
export function GoogleConnectionCard() {
  const t = useT();
  const { formatDateTime } = useFormatters();
  const confirm = useConfirm();
  const runNotified = useRunNotified();
  const { data, error, refetch } = useMaGoogleConnectionQuery({ fetchPolicy: 'cache-and-network' });
  const { connect, connecting } = useGoogleConnect();
  const [disconnect] = useMaDisconnectGoogleMutation({ refetchQueries: ['MaGoogleConnection'] });
  const connection = data?.maGoogleConnection;

  const disconnectGoogle = async () => {
    const ok = await confirm({
      title: 'Disconnect Google Meet?',
      message: 'Official transcripts and participant lists stop being imported for your meetings.',
      confirmText: 'Disconnect',
      destructive: true,
    });
    if (ok) {
      await runNotified(() => disconnect(), 'Google Meet disconnected');
    }
  };

  let body;
  if (error) {
    body = <LoadError message={error.message} onRetry={() => refetch()} />;
  } else if (!connection) {
    body = <Skeleton variant="rounded" height={88} />;
  } else if (!connection.configured) {
    body = (
      <Alert severity="info">{t('Google Meet is not configured for this company yet.')}</Alert>
    );
  } else if (connection.connected) {
    const email = connection.email ?? t('your Google account');
    body = (
      <GoogleConnectionStatus
        connected
        title={email}
        detail={
          connection.connectedAt
            ? t('Connected since {when}', { when: formatDateTime(connection.connectedAt) })
            : t('Meet transcripts and participants are imported after each call.')
        }
        action={
          <Button
            variant="outlined"
            color="error"
            startIcon={<LinkOffIcon />}
            onClick={disconnectGoogle}
          >
            {t('Disconnect')}
          </Button>
        }
      />
    );
  } else {
    body = (
      <GoogleConnectionStatus
        connected={false}
        title={t('Connect your Google account')}
        detail={t('Meet transcripts and participants are imported after each call.')}
        action={
          <Button
            variant="contained"
            startIcon={<GoogleIcon />}
            onClick={connect}
            loading={connecting}
          >
            {t('Connect Google Meet')}
          </Button>
        }
      />
    );
  }

  return (
    <Box sx={panel}>
      <Heading level={2} sx={{ typography: 'h6', mb: 1.5 }}>
        {t('Google Meet connection')}
      </Heading>
      {connection?.lastError && (
        <Alert severity="warning" sx={{ mb: 1 }}>
          {connection.lastError}
        </Alert>
      )}
      {body}
    </Box>
  );
}
