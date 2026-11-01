import { useT } from '@exyconn/i18n';
import {
  Alert,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Stack,
  Text,
  Typography,
} from '@exyconn/shell/components/ui';
import { MeetingBotTripForm } from '../forms/meeting-bot-trip';
import type { MeetingBotDemo } from '../pages/meeting-bot/useMeetingBotDemo';

type Info = NonNullable<MeetingBotDemo['info']>;

/** The limits and the form, once the demo's terms are known. */
function SendBotBody({ info, demo }: Readonly<{ info: Info; demo: MeetingBotDemo }>) {
  const t = useT();
  const usedUp = info.tripsLeftToday === 0;
  return (
    <Stack spacing={2}>
      {!info.enabled && (
        <Alert severity="warning">
          {t('The meeting bot is not set up on this server yet, so it cannot join calls.')}
        </Alert>
      )}
      <Text color="text.secondary">
        {t(
          '{name} records up to {minutes} minutes. You have {left} of {total} demo calls left today.',
          {
            name: info.botName,
            minutes: info.maxMeetingMinutes,
            left: info.tripsLeftToday,
            total: info.tripsPerDay,
          },
        )}
      </Text>
      {usedUp && (
        <Alert severity="info">{t('You have used today’s demo calls. Try again tomorrow.')}</Alert>
      )}
      <MeetingBotTripForm
        consentText={info.consentText}
        busy={demo.sending}
        disabled={!info.enabled || usedUp}
        onSend={demo.send}
      />
    </Stack>
  );
}

/** The loading, error or ready state of the demo's terms. */
function SendBotState({ demo }: Readonly<{ demo: MeetingBotDemo }>) {
  const t = useT();
  if (demo.infoError) {
    return (
      <Alert
        severity="error"
        action={
          <Button color="inherit" size="small" onClick={() => demo.retryInfo()}>
            {t('Retry')}
          </Button>
        }
      >
        {demo.infoError}
      </Alert>
    );
  }
  if (!demo.info) {
    return <CircularProgress aria-label={t('Loading')} />;
  }
  return <SendBotBody info={demo.info} demo={demo} />;
}

/** Send the notetaker into the visitor's own Google Meet call. */
export function SendBotPanel({ demo }: Readonly<{ demo: MeetingBotDemo }>) {
  const t = useT();
  return (
    <Card variant="outlined">
      <CardContent>
        <Stack spacing={2}>
          <Typography variant="h6" component="h2">
            {t('Send the notetaker to your call')}
          </Typography>
          <SendBotState demo={demo} />
        </Stack>
      </CardContent>
    </Card>
  );
}
