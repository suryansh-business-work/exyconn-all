import { useT } from '@exyconn/i18n';
import CloseIcon from '@mui/icons-material/Close';
import StopIcon from '@mui/icons-material/Stop';
import { Box, Button, Flex, Text, keyframes } from '@exyconn/shell/components/ui';

const blink = keyframes`
  0%, 100% { opacity: 1; }
  50% { opacity: 0.3; }
`;

const clock = (seconds: number): string => {
  const minutes = Math.floor(seconds / 60);
  return `${minutes}:${String(seconds % 60).padStart(2, '0')}`;
};

interface VoiceNoteControlsProps {
  seconds: number;
  onStop: () => void;
  onCancel: () => void;
}

/** Shown while a voice note records: how long it is, and keep or throw it away. */
export function VoiceNoteControls({ seconds, onStop, onCancel }: Readonly<VoiceNoteControlsProps>) {
  const t = useT();
  return (
    <Flex direction="row" spacing={1.5} alignItems="center" sx={{ px: 2, py: 1.5 }} role="status">
      <Box
        aria-hidden
        sx={{
          width: 10,
          height: 10,
          borderRadius: '50%',
          bgcolor: 'error.main',
          animation: `${blink} 1s infinite`,
        }}
      />
      <Text size="sm">{t('Recording {time}', { time: clock(seconds) })}</Text>
      <Box sx={{ flex: 1 }} />
      <Button size="small" startIcon={<CloseIcon />} onClick={onCancel}>
        {t('Cancel')}
      </Button>
      <Button size="small" variant="contained" startIcon={<StopIcon />} onClick={onStop}>
        {t('Stop and attach')}
      </Button>
    </Flex>
  );
}
