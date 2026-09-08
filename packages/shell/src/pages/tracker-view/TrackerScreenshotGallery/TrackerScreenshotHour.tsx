import { Box, Chip, Flex, Text } from '@/components/ui';
import { TrackerScreenshotActivity } from '../TrackerScreenshotActivity';
import type { DateTimeFormatter, TrackerScreenshotData } from '../tracker.types';
import type { ScreenshotHour } from './groupByHour';

interface TrackerScreenshotHourProps {
  hour: ScreenshotHour<TrackerScreenshotData>;
  /** The workspace's own time pattern, applied to the hour heading. */
  formatTime: DateTimeFormatter;
  formatDateTime: DateTimeFormatter;
  /** Opens the full-screen viewer at a position in the DAY, not in this hour. */
  onOpen: (index: number) => void;
}

/**
 * One hour of captures: the hour on the clock, how many landed in it, and the thumbnails.
 *
 * The count in the heading is the part a reviewer reads first — an hour with one shot in it
 * where every other hour has six is the thing worth asking about, and it is invisible in an
 * undivided wall of thumbnails.
 */
export function TrackerScreenshotHour({
  hour,
  formatTime,
  formatDateTime,
  onOpen,
}: Readonly<TrackerScreenshotHourProps>) {
  const count = hour.shots.length;

  return (
    <Box>
      <Flex direction="row" alignItems="baseline" spacing={1} sx={{ mb: 0.75 }}>
        <Text size="sm" weight="bold">
          {formatTime(hour.startsAt)}
        </Text>
        <Text size="caption" color="text.secondary">
          {count === 1 ? '1 screenshot' : `${count} screenshots`}
        </Text>
      </Flex>
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(96px, 1fr))',
          gap: 1,
        }}
      >
        {hour.shots.map((shot, position) => (
          <Box key={shot.id}>
            <Box
              component="button"
              type="button"
              onClick={() => onOpen(hour.firstIndex + position)}
              aria-label={`Open screenshot from ${formatDateTime(shot.capturedAt)}`}
              sx={{
                p: 0,
                border: 0,
                width: '100%',
                display: 'block',
                cursor: 'pointer',
                borderRadius: '4px',
                overflow: 'hidden',
                position: 'relative',
                bgcolor: 'transparent',
              }}
            >
              <Box
                component="img"
                src={shot.imageUrl}
                alt=""
                loading="lazy"
                sx={{ width: '100%', height: 72, objectFit: 'cover', display: 'block' }}
              />
              {shot.blurred && (
                <Chip label="Blurred" size="small" sx={{ position: 'absolute', top: 4, left: 4 }} />
              )}
            </Box>
            <TrackerScreenshotActivity percent={shot.activityPercent} />
          </Box>
        ))}
      </Box>
    </Box>
  );
}
