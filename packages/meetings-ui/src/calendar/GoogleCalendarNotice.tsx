import { useT } from '@exyconn/i18n';
import GoogleIcon from '@mui/icons-material/Google';
import { Alert, Button } from '@exyconn/shell/components/ui';
import { MaCalendarGoogleState } from '@exyconn/shell/graphql/generated';
import { useGoogleConnect } from '../lib/useGoogleConnect';

interface GoogleCalendarNoticeProps {
  google: MaCalendarGoogleState;
  /** Why Google could not be read, when it could not. */
  googleError: string;
}

/** One inline line on why Google events are missing, with the way to fix it when there is one. */
export function GoogleCalendarNotice({ google, googleError }: Readonly<GoogleCalendarNoticeProps>) {
  const t = useT();
  const { connect, connecting } = useGoogleConnect();
  const action = (label: string) => (
    <Button
      color="inherit"
      size="small"
      startIcon={<GoogleIcon />}
      onClick={connect}
      loading={connecting}
    >
      {t(label)}
    </Button>
  );
  switch (google) {
    case MaCalendarGoogleState.NotConfigured:
      return (
        <Alert severity="info" sx={{ mb: 1.5 }}>
          {t('Google Meet is not configured for this company yet.')}
        </Alert>
      );
    case MaCalendarGoogleState.NotConnected:
      return (
        <Alert severity="info" sx={{ mb: 1.5 }} action={action('Connect Google Meet')}>
          {t('Connect Google Meet to see your Google Calendar meetings here too.')}
        </Alert>
      );
    case MaCalendarGoogleState.ReconnectRequired:
      return (
        <Alert severity="warning" sx={{ mb: 1.5 }} action={action('Reconnect Google')}>
          {t('Reconnect Google to see your calendar')}
        </Alert>
      );
    case MaCalendarGoogleState.Unavailable:
      return (
        <Alert severity="warning" sx={{ mb: 1.5 }}>
          {t(googleError)}
        </Alert>
      );
    default:
      return null;
  }
}
