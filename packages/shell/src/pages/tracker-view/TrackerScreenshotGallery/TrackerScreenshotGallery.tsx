import { useMemo, useState } from 'react';
import { Flex, Text } from '@/components/ui';
import type { DateTimeFormatter, TrackerScreenshotData } from '../tracker.types';
import { groupScreenshotsByHour } from './groupByHour';
import { TrackerScreenshotHour } from './TrackerScreenshotHour';
import { TrackerScreenshotLightbox } from './TrackerScreenshotLightbox';

interface TrackerScreenshotGalleryProps {
  screenshots: readonly TrackerScreenshotData[];
  /** The zone the day is being read in — which hour a capture falls in depends on it. */
  timezone: string;
  /** The workspace's own time pattern, for the hour headings. */
  formatTime: DateTimeFormatter;
  formatDateTime: DateTimeFormatter;
}

/**
 * A day's screenshots, grouped by the hour they were taken in; clicking one opens it FULL
 * SCREEN, with the rest of the day behind the arrow keys.
 *
 * A 96px thumbnail shows that a capture exists and nothing about what it caught, and these
 * are the images a manager makes judgements from — they need to be readable at the size they
 * were taken at. The hours are what makes a day of them navigable: "what was happening at
 * four" is the question actually being asked, and the viewer still pages across the whole
 * day, because the answer usually spans the boundary.
 */
export function TrackerScreenshotGallery({
  screenshots,
  timezone,
  formatTime,
  formatDateTime,
}: Readonly<TrackerScreenshotGalleryProps>) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const { ordered, hours } = useMemo(
    () => groupScreenshotsByHour(screenshots, timezone),
    [screenshots, timezone],
  );

  if (ordered.length === 0) {
    return (
      <Text size="sm" color="text.secondary">
        No screenshots captured.
      </Text>
    );
  }

  return (
    <>
      <Flex direction="column" spacing={2}>
        {hours.map((hour) => (
          <TrackerScreenshotHour
            key={hour.key}
            hour={hour}
            formatTime={formatTime}
            formatDateTime={formatDateTime}
            onOpen={setOpenIndex}
          />
        ))}
      </Flex>

      <TrackerScreenshotLightbox
        shots={ordered}
        index={openIndex}
        formatDateTime={formatDateTime}
        onClose={() => setOpenIndex(null)}
        onNavigate={setOpenIndex}
      />
    </>
  );
}
