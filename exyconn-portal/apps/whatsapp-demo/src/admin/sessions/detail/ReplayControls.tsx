import { useT } from '@exyconn/i18n';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import PauseIcon from '@mui/icons-material/Pause';
import SkipNextIcon from '@mui/icons-material/SkipNext';
import SkipPreviousIcon from '@mui/icons-material/SkipPrevious';
import ReplayIcon from '@mui/icons-material/Replay';
import { Button, IconButton, Stack, Typography } from '@exyconn/shell/components/ui';
import type { Replay } from './useReplay';

interface ReplayControlsProps {
  replay: Replay;
  count: number;
}

/** The replay's transport: play/pause, step back and forward, start over, and where it is. */
export function ReplayControls({ replay, count }: Readonly<ReplayControlsProps>) {
  const t = useT();
  const started = replay.index >= 0;
  const position = started
    ? t('Event {current} of {total}', { current: replay.index + 1, total: count })
    : t('{total} events', { total: count });

  return (
    <Stack direction="row" spacing={1} sx={{ alignItems: 'center', flexWrap: 'wrap' }}>
      {replay.playing ? (
        <Button size="small" variant="contained" startIcon={<PauseIcon />} onClick={replay.pause}>
          {t('Pause')}
        </Button>
      ) : (
        <Button
          size="small"
          variant="contained"
          startIcon={<PlayArrowIcon />}
          onClick={replay.play}
          disabled={count === 0}
        >
          {t('Replay')}
        </Button>
      )}
      <IconButton
        size="small"
        aria-label={t('Previous event')}
        onClick={replay.previous}
        disabled={replay.index <= 0}
      >
        <SkipPreviousIcon />
      </IconButton>
      <IconButton
        size="small"
        aria-label={t('Next event')}
        onClick={replay.next}
        disabled={replay.index >= count - 1}
      >
        <SkipNextIcon />
      </IconButton>
      <IconButton
        size="small"
        aria-label={t('Stop the replay')}
        onClick={replay.reset}
        disabled={!started}
      >
        <ReplayIcon />
      </IconButton>
      {/* Announced as it changes, so the replay can be followed without watching it. */}
      <Typography
        variant="caption"
        role="status"
        aria-live="polite"
        sx={{ color: 'text.secondary', ml: 'auto' }}
      >
        {position}
      </Typography>
    </Stack>
  );
}
