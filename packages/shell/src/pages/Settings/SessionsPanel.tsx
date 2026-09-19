import { useT } from '@exyconn/i18n';
import { Alert, Box, Button, Chip, Flex, Heading, LinearProgress, Text } from '@/components/ui';
import { readingPanel } from '@/components/glass/glass';
import { useConfirm } from '@/components/feedback/ConfirmProvider';
import { useNotify } from '@/components/feedback/NotificationProvider';
import { useSettings } from '@/hooks/useSettings';
import { errorMessage } from '@/utils/errorMessage';
import {
  useMySessionsQuery,
  useRevokeSessionMutation,
  useRevokeOtherSessionsMutation,
  type MySessionsQuery,
} from '@/graphql/generated';

type Session = MySessionsQuery['mySessions'][number];

/**
 * A user agent as a person would name the device.
 *
 * Deliberately coarse: the point is to recognise "my laptop" against "something in another
 * country", and printing the full string would be a fingerprint on a screen somebody may be
 * sharing. Anything unrecognised stays honest rather than guessing.
 */
export function deviceName(userAgent: string): string {
  if (!userAgent) {
    return 'Unknown device';
  }
  const browsers = [
    ['Edg/', 'Edge'],
    ['OPR/', 'Opera'],
    ['Chrome/', 'Chrome'],
    ['Firefox/', 'Firefox'],
    ['Safari/', 'Safari'],
  ] as const;
  const platforms = [
    ['Windows', 'Windows'],
    ['Macintosh', 'macOS'],
    ['iPhone', 'iPhone'],
    ['iPad', 'iPad'],
    ['Android', 'Android'],
    ['Linux', 'Linux'],
  ] as const;
  const browser = browsers.find(([token]) => userAgent.includes(token))?.[1];
  const platform = platforms.find(([token]) => userAgent.includes(token))?.[1];
  if (browser && platform) {
    return `${browser} on ${platform}`;
  }
  return browser ?? platform ?? 'Unknown device';
}

interface SessionRowProps {
  session: Session;
  formatDateTime: (value: string | null | undefined) => string;
  onEnd: (session: Session) => void;
}

function SessionRow({ session, formatDateTime, onEnd }: Readonly<SessionRowProps>) {
  const t = useT();
  return (
    <Flex
      direction="row"
      spacing={1}
      sx={{ alignItems: 'center', justifyContent: 'space-between', py: 1 }}
    >
      <Box>
        <Flex direction="row" spacing={0.5} sx={{ alignItems: 'center' }}>
          <Text size="sm">{t(deviceName(session.userAgent))}</Text>
          {session.current && <Chip size="small" label={t('This device')} color="success" />}
        </Flex>
        <Text size="caption" color="text.secondary">
          {t('{ip} · last used {when}', {
            ip: session.ip || t('unknown address'),
            when: formatDateTime(session.lastSeenAt),
          })}
        </Text>
      </Box>
      {!session.current && (
        <Button size="small" variant="outlined" onClick={() => onEnd(session)}>
          {t('End')}
        </Button>
      )}
    </Flex>
  );
}

/**
 * Account settings: everywhere this account is signed in.
 *
 * Before this the only way out of a device somebody had lost was to change the password,
 * which signs out every browser, phone and tracker at once. A list with an End button is
 * the answer to "that one, not the rest".
 */
export function SessionsPanel() {
  const t = useT();
  const notify = useNotify();
  const confirm = useConfirm();
  const { formatDateTime } = useSettings();
  const { data, loading, error, refetch } = useMySessionsQuery({
    fetchPolicy: 'cache-and-network',
  });
  const [revoke] = useRevokeSessionMutation();
  const [revokeOthers] = useRevokeOtherSessionsMutation();

  const sessions = data?.mySessions ?? [];
  const others = sessions.filter((session) => !session.current).length;

  const endOne = async (session: Session) => {
    const ok = await confirm({
      title: 'End this session?',
      message: 'Signing out {device} takes effect immediately.',
      messageValues: { device: deviceName(session.userAgent) },
      confirmText: 'End session',
    });
    if (!ok) {
      return;
    }
    try {
      await revoke({ variables: { id: session.id } });
      await refetch();
      notify(t('That device has been signed out.'), 'success');
    } catch (err) {
      notify(errorMessage(err, t('The session could not be ended.')), 'error');
    }
  };

  const endOthers = async () => {
    const ok = await confirm({
      title: 'Sign out everywhere else?',
      message: 'Every other browser and device will have to sign in again.',
      confirmText: 'Sign out others',
    });
    if (!ok) {
      return;
    }
    try {
      const { data: result } = await revokeOthers();
      await refetch();
      notify(
        t('{count} other session(s) ended.', { count: result?.revokeOtherSessions ?? 0 }),
        'success',
      );
    } catch (err) {
      notify(errorMessage(err, t('Those sessions could not be ended.')), 'error');
    }
  };

  return (
    <Box sx={readingPanel}>
      <Heading level={6} sx={{ mb: 0.5 }}>
        {t('Where you are signed in')}
      </Heading>
      <Text size="sm" color="text.secondary" sx={{ mb: 1 }}>
        {t('End a session on a device you no longer have, without changing your password.')}
      </Text>
      {loading && sessions.length === 0 && <LinearProgress sx={{ mb: 1 }} />}
      {error && <Alert severity="error">{errorMessage(error, t('Sessions unavailable.'))}</Alert>}
      {sessions.map((session) => (
        <SessionRow
          key={session.id}
          session={session}
          formatDateTime={formatDateTime}
          onEnd={endOne}
        />
      ))}
      {others > 0 && (
        <Button size="small" variant="outlined" sx={{ mt: 1 }} onClick={endOthers}>
          {t('Sign out everywhere else')}
        </Button>
      )}
    </Box>
  );
}
