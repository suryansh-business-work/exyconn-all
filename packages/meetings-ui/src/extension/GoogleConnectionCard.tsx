import { useFormatters, useT } from '@exyconn/i18n';
import GoogleIcon from '@mui/icons-material/Google';
import LinkOffIcon from '@mui/icons-material/LinkOff';
import { Alert, Box, Button, Flex, Heading, Skeleton, Text } from '@exyconn/shell/components/ui';
import { panel } from '@exyconn/shell/components/glass/glass';
import { useConfirm } from '@exyconn/shell/components/feedback/ConfirmProvider';
import { useNotify } from '@exyconn/shell/components/feedback/NotificationProvider';
import { errorMessage } from '@exyconn/shell/utils/errorMessage';
import {
  useMaDisconnectGoogleMutation,
  useMaGoogleConnectionQuery,
  useMaStartGoogleConnectMutation,
} from '@exyconn/shell/graphql/generated';
import { LoadError } from '../lib/LoadError';
import { useRunNotified } from '../lib/useRunNotified';

/**
 * The viewer's Google Meet connection, which lets the portal import Meet's own transcript and
 * participant list after a call (read-only scope).
 */
export function GoogleConnectionCard() {
  const t = useT();
  const { formatDateTime } = useFormatters();
  const confirm = useConfirm();
  const notify = useNotify();
  const runNotified = useRunNotified();
  const { data, error, refetch } = useMaGoogleConnectionQuery({ fetchPolicy: 'cache-and-network' });
  const [startConnect, { loading: connecting }] = useMaStartGoogleConnectMutation();
  const [disconnect] = useMaDisconnectGoogleMutation({ refetchQueries: ['MaGoogleConnection'] });
  const connection = data?.maGoogleConnection;

  const connect = async () => {
    try {
      const result = await startConnect({ variables: { returnTo: globalThis.location.href } });
      const url = result.data?.maStartGoogleConnect;
      if (url) {
        globalThis.location.assign(url);
      }
    } catch (error) {
      notify(errorMessage(error, 'Google sign-in could not be started.'), 'error');
    }
  };
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
    body = <Skeleton variant="rounded" height={48} />;
  } else if (!connection.configured) {
    body = (
      <Alert severity="info">{t('Google Meet is not configured for this company yet.')}</Alert>
    );
  } else if (connection.connected) {
    body = (
      <Flex direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
        <Text size="sm">
          {connection.connectedAt
            ? t('Connected as {email} since {when}', {
                email: connection.email ?? t('your Google account'),
                when: formatDateTime(connection.connectedAt),
              })
            : t('Connected as {email}', { email: connection.email ?? t('your Google account') })}
        </Text>
        <Button color="error" startIcon={<LinkOffIcon />} onClick={disconnectGoogle}>
          {t('Disconnect')}
        </Button>
      </Flex>
    );
  } else {
    body = (
      <Button variant="contained" startIcon={<GoogleIcon />} onClick={connect} loading={connecting}>
        {t('Connect Google Meet')}
      </Button>
    );
  }

  return (
    <Box sx={panel}>
      <Heading level={2} sx={{ typography: 'h6', mb: 1 }}>
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
