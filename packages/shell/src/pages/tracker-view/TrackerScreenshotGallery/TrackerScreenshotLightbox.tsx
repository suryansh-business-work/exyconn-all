import { useCallback, useEffect } from 'react';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import CloseIcon from '@mui/icons-material/Close';
import { Box, Chip, Dialog, Flex, IconButton, Text } from '@/components/ui';
import { TrackerScreenshotActivity } from '../TrackerScreenshotActivity';
import type { DateTimeFormatter, TrackerScreenshotData } from '../tracker.types';

interface TrackerScreenshotLightboxProps {
  /** The whole day in capture order — paging crosses hours, because a day does. */
  shots: readonly TrackerScreenshotData[];
  /** Index of the shot on screen, or null when the viewer is closed. */
  index: number | null;
  formatDateTime: DateTimeFormatter;
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
 * One screenshot, full screen, with the rest of the day one press away.
 *
 * Reviewing captures means comparing them — what was on screen at 10:07 against 10:22 — and
 * closing the viewer to click the next thumbnail loses your place every time. Paging wraps,
 * so walking a day never dead-ends, and the arrow keys do the same as the buttons because
 * this is the kind of view people drive from the keyboard.
 */
export function TrackerScreenshotLightbox({
  shots,
  index,
  formatDateTime,
  onClose,
  onNavigate,
}: Readonly<TrackerScreenshotLightboxProps>) {
  const step = useCallback(
    (delta: number) => {
      if (index === null || shots.length === 0) return;
      onNavigate((index + delta + shots.length) % shots.length);
    },
    [index, shots.length, onNavigate],
  );

  useEffect(() => {
    if (index === null) return undefined;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'ArrowRight') step(1);
      if (event.key === 'ArrowLeft') step(-1);
    };
    globalThis.addEventListener('keydown', onKeyDown);
    return () => globalThis.removeEventListener('keydown', onKeyDown);
  }, [index, step]);

  const position = index ?? -1;
  const shot = shots[position];
  if (!shot) return null;

  const capturedAt = formatDateTime(shot.capturedAt);
  const many = shots.length > 1;

  return (
    // Escape and a backdrop click both close it, which is what a full-screen viewer owes.
    <Dialog open fullScreen onClose={onClose} aria-label="Screenshot, full screen">
      <Box
        sx={{
          position: 'relative',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          bgcolor: 'common.black',
        }}
      >
        <Flex
          direction="row"
          alignItems="center"
          justifyContent="space-between"
          spacing={1}
          sx={{ px: 2, py: 1.25, color: 'common.white' }}
        >
          <Flex direction="row" alignItems="center" spacing={1.25} sx={{ minWidth: 0 }}>
            <Text size="sm" noWrap>
              {capturedAt}
            </Text>
            {shot.blurred && <Chip label="Blurred" size="small" variant="outlined" />}
          </Flex>
          <Flex direction="row" alignItems="center" spacing={1.5}>
            {many && (
              <Text size="caption" sx={{ opacity: 0.7 }}>
                {`${position + 1} / ${shots.length}`}
              </Text>
            )}
            <IconButton aria-label="Close" onClick={onClose} sx={{ color: 'common.white' }}>
              <CloseIcon />
            </IconButton>
          </Flex>
        </Flex>

        <Box sx={{ flex: 1, minHeight: 0, display: 'grid', placeItems: 'center', p: 2, pt: 0 }}>
          <Box
            component="img"
            src={shot.imageUrl}
            alt={`Screenshot captured ${capturedAt}, full screen`}
            sx={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain', display: 'block' }}
          />
        </Box>

        <Box sx={{ px: 2, pb: 1.5, color: 'common.white' }}>
          <TrackerScreenshotActivity percent={shot.activityPercent} />
        </Box>

        {many && (
          <>
            <IconButton
              aria-label="Previous screenshot"
              onClick={() => step(-1)}
              sx={{ ...NAV_SX, left: 12 }}
            >
              <ChevronLeftIcon />
            </IconButton>
            <IconButton
              aria-label="Next screenshot"
              onClick={() => step(1)}
              sx={{ ...NAV_SX, right: 12 }}
            >
              <ChevronRightIcon />
            </IconButton>
          </>
        )}
      </Box>
    </Dialog>
  );
}
