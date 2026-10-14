import CallIcon from '@mui/icons-material/Call';
import CallEndIcon from '@mui/icons-material/CallEnd';
import { useT } from '@exyconn/i18n';
import { IconButton, Stack, Text } from '@exyconn/shell/components/ui';

interface CallButtonProps {
  /** Whether a call is ringing or live, so the button hangs up instead of dialling. */
  onCall: boolean;
  onStart: () => void;
  onHangUp: () => void;
}

/** The phone's round green or red button, labelled underneath like a dialler's. */
export function CallButton({ onCall, onStart, onHangUp }: Readonly<CallButtonProps>) {
  const t = useT();
  const tone = onCall ? 'error' : 'success';
  const label = onCall ? t('Hang up') : t('Start the call');
  return (
    <Stack spacing={1} sx={{ alignItems: 'center' }}>
      <IconButton
        aria-label={label}
        onClick={onCall ? onHangUp : onStart}
        sx={{
          width: (theme) => theme.spacing(8),
          height: (theme) => theme.spacing(8),
          borderRadius: '50%',
          bgcolor: `${tone}.main`,
          color: `${tone}.contrastText`,
          boxShadow: 4,
          '&:hover': { bgcolor: `${tone}.dark` },
        }}
      >
        {onCall ? <CallEndIcon fontSize="large" /> : <CallIcon fontSize="large" />}
      </IconButton>
      <Text size="caption" color="text.secondary">
        {label}
      </Text>
    </Stack>
  );
}
