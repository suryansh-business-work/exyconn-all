import { useT } from '@exyconn/i18n';
import { E164_PHONE } from '@exyconn/regex';
import { useVisitor } from '@exyconn/demo-visitor';
import {
  Alert,
  Button,
  Card,
  CardContent,
  Stack,
  Text,
  Typography,
} from '@exyconn/shell/components/ui';
import { usePhoneCall } from '../call/usePhoneCall';
import { PhoneCallForm } from '../forms/phone-call';
import { CallStatus } from './CallStatus';
import { Transcript } from './Transcript';

interface PhoneCallPanelProps {
  /** The example the bot plays; null keeps its own settings. */
  scenarioId: string | null;
}

/** Have the bot ring the caller's own phone, and follow what is said here. */
export function PhoneCallPanel({ scenarioId }: Readonly<PhoneCallPanelProps>) {
  const t = useT();
  const { visitor } = useVisitor();
  const call = usePhoneCall(scenarioId);
  const own = visitor?.phone ?? '';
  const defaultPhone = E164_PHONE.test(own) ? own : '';
  return (
    <Card variant="outlined" sx={{ height: '100%' }}>
      <CardContent>
        <Stack spacing={2}>
          <div>
            <Typography variant="h6" component="h2">
              {t('Get a call on your phone')}
            </Typography>
            <Text color="text.secondary">
              {t('The bot rings your number and talks to you like a real caller would.')}
            </Text>
          </div>
          <CallStatus phase={call.phase} startedAt={call.startedAt} />
          {call.error && <Alert severity="error">{call.error}</Alert>}
          {call.phase === 'idle' && (
            <PhoneCallForm defaultPhone={defaultPhone} busy={false} onCall={call.start} />
          )}
          {call.phase === 'ended' && (
            <Button variant="outlined" onClick={call.reset}>
              {t('Call again')}
            </Button>
          )}
          <Transcript lines={call.lines} />
        </Stack>
      </CardContent>
    </Card>
  );
}
