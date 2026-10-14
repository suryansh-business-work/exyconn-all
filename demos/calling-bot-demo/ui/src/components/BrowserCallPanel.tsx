import CallIcon from '@mui/icons-material/Call';
import CallEndIcon from '@mui/icons-material/CallEnd';
import { useT } from '@exyconn/i18n';
import {
  Alert,
  Button,
  Card,
  CardContent,
  Stack,
  Text,
  Typography,
} from '@exyconn/shell/components/ui';
import { useBrowserCall } from '../call/useBrowserCall';
import { CallStatus } from './CallStatus';
import { Transcript } from './Transcript';

/** Talk to the bot from this browser: the microphone in, the bot's voice out. */
export function BrowserCallPanel() {
  const t = useT();
  const call = useBrowserCall();
  const onCall = call.phase === 'connecting' || call.phase === 'live';
  return (
    <Card variant="outlined" sx={{ height: '100%' }}>
      <CardContent>
        <Stack spacing={2}>
          <div>
            <Typography variant="h6" component="h2">
              {t('Call from your browser')}
            </Typography>
            <Text color="text.secondary">
              {t('Use your microphone and speakers. Headphones keep the bot from hearing itself.')}
            </Text>
          </div>
          <CallStatus phase={call.phase} startedAt={call.startedAt} />
          {call.error && <Alert severity="error">{call.error}</Alert>}
          {onCall ? (
            <Button
              variant="contained"
              color="error"
              startIcon={<CallEndIcon />}
              onClick={call.hangUp}
            >
              {t('Hang up')}
            </Button>
          ) : (
            <Button
              variant="contained"
              color="success"
              startIcon={<CallIcon />}
              onClick={call.start}
            >
              {t('Start the call')}
            </Button>
          )}
          <Transcript lines={call.lines} />
        </Stack>
      </CardContent>
    </Card>
  );
}
