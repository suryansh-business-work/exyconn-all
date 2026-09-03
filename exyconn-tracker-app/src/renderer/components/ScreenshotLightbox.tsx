import { useCallback, useEffect } from 'react';
import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Dialog from '@mui/material/Dialog';
import IconButton from '@mui/material/IconButton';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import CloseRounded from '@mui/icons-material/CloseRounded';
import ChevronLeftRounded from '@mui/icons-material/ChevronLeftRounded';
import ChevronRightRounded from '@mui/icons-material/ChevronRightRounded';
import type { DayScreenshot } from '@shared/types';
import { activityColor, activityLabel } from '../activity';
import { formatDateTime } from '../time';

interface Props {
  shots: readonly DayScreenshot[];
  /** Index into `shots` of the one on screen, or `null` when the lightbox is closed. */
  index: number | null;
  timezone: string;
  onClose: () => void;
  onNavigate: (index: number) => void;
}

const NAV_SX = {
  position: 'absolute',
  top: '50%',
  transform: 'translateY(-50%)',
  color: 'common.white',
  backgroundColor: 'rgba(0, 0, 0, 0.45)',
  '&:hover': { backgroundColor: 'rgba(0, 0, 0, 0.7)' },
} as const;

/**
 * One screenshot, full screen.
 *
 * A 300px thumbnail is enough to know a shot exists and nowhere near enough to see what it
 * actually caught. An employee reviewing a photograph of their own screen — which their
 * manager will read at full size — is owed the same view of it.
 */
export default function ScreenshotLightbox({
  shots,
  index,
  timezone,
  onClose,
  onNavigate,
}: Readonly<Props>): JSX.Element | null {
  const shot = index === null ? null : shots[index];

  const step = useCallback(
    (delta: number) => {
      if (index === null || shots.length === 0) {
        return;
      }
      // Wraps, so paging through a day never dead-ends on the first or last shot.
      onNavigate((index + delta + shots.length) % shots.length);
    },
    [index, shots.length, onNavigate],
  );

  useEffect(() => {
    if (index === null) {
      return undefined;
    }
    const onKeyDown = (event: KeyboardEvent): void => {
      if (event.key === 'ArrowRight') step(1);
      if (event.key === 'ArrowLeft') step(-1);
    };
    globalThis.addEventListener('keydown', onKeyDown);
    return () => globalThis.removeEventListener('keydown', onKeyDown);
  }, [index, step]);

  if (shot === undefined || shot === null) {
    return null;
  }

  const capturedAt = formatDateTime(shot.capturedAt, timezone);
  const many = shots.length > 1;

  return (
    // Dialog closes on Escape and on a backdrop click for free — both are what a full-screen
    // image viewer is expected to do.
    <Dialog open fullScreen onClose={onClose} aria-label="Screenshot, full screen">
      <Box
        sx={{
          position: 'relative',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: 'common.black',
        }}
      >
        <Stack
          direction="row"
          alignItems="center"
          justifyContent="space-between"
          spacing={1}
          sx={{ px: 2, py: 1.25, color: 'common.white' }}
        >
          <Stack direction="row" spacing={1.25} alignItems="center" sx={{ minWidth: 0 }}>
            <Typography variant="body2" noWrap>
              {capturedAt}
            </Typography>
            <Chip
              size="small"
              variant="outlined"
              color={activityColor(shot.activityPercent)}
              label={activityLabel(shot.activityPercent)}
            />
            {shot.blurred ? <Chip size="small" variant="outlined" label="Blurred" /> : null}
          </Stack>
          <Stack direction="row" spacing={1.5} alignItems="center">
            {many ? (
              <Typography variant="caption" sx={{ opacity: 0.7 }}>
                {(index ?? 0) + 1} / {shots.length}
              </Typography>
            ) : null}
            <IconButton aria-label="Close" onClick={onClose} sx={{ color: 'common.white' }}>
              <CloseRounded />
            </IconButton>
          </Stack>
        </Stack>

        <Box sx={{ flex: 1, minHeight: 0, display: 'grid', placeItems: 'center', p: 2, pt: 0 }}>
          <Box
            component="img"
            src={shot.imageUrl}
            alt={`Screenshot captured at ${capturedAt}, full screen`}
            sx={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain', display: 'block' }}
          />
        </Box>

        {many ? (
          <>
            <IconButton aria-label="Previous" onClick={() => step(-1)} sx={{ ...NAV_SX, left: 12 }}>
              <ChevronLeftRounded />
            </IconButton>
            <IconButton aria-label="Next" onClick={() => step(1)} sx={{ ...NAV_SX, right: 12 }}>
              <ChevronRightRounded />
            </IconButton>
          </>
        ) : null}
      </Box>
    </Dialog>
  );
}
