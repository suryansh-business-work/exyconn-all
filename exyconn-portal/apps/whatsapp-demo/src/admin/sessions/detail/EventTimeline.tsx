import { useT } from '@exyconn/i18n';
import { Box, Stack, useMediaQuery } from '@exyconn/shell/components/ui';
import { EmptyState } from '@exyconn/shell/components/feedback/EmptyState';
import { EventItem, type DemoEvent } from './EventItem';
import { ReplayControls } from './ReplayControls';
import { useReplay } from './useReplay';

const REDUCED_MOTION = '(prefers-reduced-motion: reduce)';

interface EventTimelineProps {
  events: readonly DemoEvent[];
  industryName: (demoKey: string) => string;
}

/** A session's events, oldest first, with the replay transport above them. */
export function EventTimeline({ events, industryName }: Readonly<EventTimelineProps>) {
  const t = useT();
  const replay = useReplay(events.length);
  const reducedMotion = useMediaQuery(REDUCED_MOTION);

  if (events.length === 0) {
    return <EmptyState title="This session recorded no events." />;
  }

  return (
    <Stack spacing={1.5}>
      <ReplayControls replay={replay} count={events.length} />
      <Box
        component="ol"
        aria-label={t('Session events')}
        sx={{ listStyle: 'none', m: 0, p: 0, display: 'grid', gap: 0.5 }}
      >
        {events.map((event, position) => (
          <EventItem
            key={event.id}
            event={event}
            current={position === replay.index}
            industryName={industryName}
            reducedMotion={reducedMotion}
          />
        ))}
      </Box>
    </Stack>
  );
}
