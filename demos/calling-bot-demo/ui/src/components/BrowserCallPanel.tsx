import SupportAgentIcon from '@mui/icons-material/SupportAgent';
import { useT } from '@exyconn/i18n';
import { Alert, Box, Stack, Typography } from '@exyconn/shell/components/ui';
import { useBrowserCall } from '../call/useBrowserCall';
import { CallButton } from './CallButton';
import { CallStatus } from './CallStatus';
import { PhoneFrame } from './phone/PhoneFrame';
import { Transcript } from './Transcript';

/** Talk to the bot from this browser, on a drawn phone: the microphone in, the bot's voice out. */
export function BrowserCallPanel() {
  const t = useT();
  const call = useBrowserCall();
  const onCall = call.phase === 'connecting' || call.phase === 'live';
  return (
    <PhoneFrame>
      <Stack spacing={1} sx={{ alignItems: 'center', pt: 6, pb: 2, px: 2 }}>
        <Box
          aria-hidden
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: '50%',
            bgcolor: 'primary.main',
            color: 'primary.contrastText',
            width: (theme) => theme.spacing(8),
            height: (theme) => theme.spacing(8),
          }}
        >
          <SupportAgentIcon fontSize="large" />
        </Box>
        <Typography variant="h6" component="h2">
          {t('Exyconn AI assistant')}
        </Typography>
        <Box sx={{ minWidth: (theme) => theme.spacing(16) }}>
          <CallStatus phase={call.phase} startedAt={call.startedAt} />
        </Box>
      </Stack>
      <Box sx={{ flex: 1, minHeight: 0, px: 2 }}>
        <Transcript lines={call.lines} fill />
      </Box>
      {call.error && (
        <Alert severity="error" sx={{ mx: 2, mt: 1 }}>
          {call.error}
        </Alert>
      )}
      <Box sx={{ py: 3 }}>
        <CallButton onCall={onCall} onStart={call.start} onHangUp={call.hangUp} />
      </Box>
    </PhoneFrame>
  );
}
