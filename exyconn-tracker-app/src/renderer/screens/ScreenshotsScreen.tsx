import { useState } from 'react';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Skeleton from '@mui/material/Skeleton';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { useDayDetail } from '../hooks/useMyDay';
import { formatCount } from '../format';
import { formatDayInZone, offsetLabel } from '../time';
import ScreenshotCard from '../components/ScreenshotCard';
import ScreenshotLightbox from '../components/ScreenshotLightbox';

interface Props {
  startISO: string;
  endISO: string;
  timezone: string;
}

const SKELETONS = ['a', 'b', 'c', 'd', 'e', 'f'] as const;

/** The gallery grid — wide enough that a screenshot is actually legible, unlike a 140px thumb. */
const GRID = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
  gap: 2,
} as const;

/**
 * The employee's own screenshots for one day, in their own window. Every shot carries the two
 * things they are owed about a photograph of their screen: exactly when it was taken (in their
 * zone), and how active the interval it was judging them on actually was.
 */
export default function ScreenshotsScreen({
  startISO,
  endISO,
  timezone,
}: Readonly<Props>): JSX.Element {
  const { detail, loading, error } = useDayDetail(startISO, endISO);
  const shots = detail?.screenshots ?? [];
  /** Index of the shot open full screen, or null. Held here so paging can walk the day. */
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <Box sx={{ flex: 1, minHeight: 0, overflow: 'auto', p: 3 }}>
      <Stack spacing={0.25} sx={{ mb: 2.5 }}>
        <Typography variant="h6">My screenshots</Typography>
        <Typography variant="caption" color="text.secondary">
          {formatDayInZone(startISO, timezone)} · times shown in {timezone} ({offsetLabel(timezone)}
          )
        </Typography>
      </Stack>

      {error !== null ? (
        <Alert severity="error" variant="outlined" sx={{ borderRadius: '4px' }}>
          {error}
        </Alert>
      ) : null}

      {loading && error === null ? (
        <Box sx={GRID}>
          {SKELETONS.map((id) => (
            <Skeleton key={id} variant="rounded" height={240} />
          ))}
        </Box>
      ) : null}

      {!loading && error === null && shots.length === 0 ? (
        <Typography variant="body2" color="text.secondary" textAlign="center" sx={{ py: 6 }}>
          No screenshots were captured on this day.
        </Typography>
      ) : null}

      {shots.length > 0 ? (
        <>
          <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 1.5 }}>
            {formatCount(shots.length)} captured
          </Typography>
          <Box sx={GRID}>
            {shots.map((shot, index) => (
              <ScreenshotCard
                key={shot.id}
                shot={shot}
                timezone={timezone}
                onOpen={() => setOpenIndex(index)}
              />
            ))}
          </Box>
        </>
      ) : null}

      <ScreenshotLightbox
        shots={shots}
        index={openIndex}
        timezone={timezone}
        onClose={() => setOpenIndex(null)}
        onNavigate={setOpenIndex}
      />
    </Box>
  );
}
