import type { ReactElement } from 'react';
import { useMemo } from 'react';
import { Skeleton, Typography } from '@exyconn/ui';
import type { DayDetail } from '@shared/types';
import { dayStripes, formatTimeOfDay } from '@exyconn/tracker-core';
import ActivityCard from './ActivityCard';
import StripesChart from './StripesChart';

interface Props {
  title: string;
  detail: DayDetail | null;
  loading: boolean;
  timezone: string;
}

/**
 * One day's synced intervals, each a stripe as tall as it was active and placed at the time it
 * ran, so a break shows as a gap. Only what reached the portal is drawn.
 */
export default function DayActivityChart({
  title,
  detail,
  loading,
  timezone,
}: Readonly<Props>): ReactElement {
  const shaped = useMemo(() => dayStripes(detail?.intervals ?? []), [detail]);
  const { span } = shaped;

  if (span === null) {
    return (
      <ActivityCard title={title} percent={null}>
        {loading ? (
          <Skeleton variant="rounded" height={140} />
        ) : (
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            Nothing has synced for this day yet.
          </Typography>
        )}
      </ActivityCard>
    );
  }

  const labels = {
    start: formatTimeOfDay(span.startISO, timezone),
    middle: formatTimeOfDay(span.midISO, timezone),
    end: formatTimeOfDay(span.endISO, timezone),
  };
  return (
    <ActivityCard title={title} percent={shaped.averagePercent}>
      <StripesChart
        bars={shaped.stripes}
        labels={labels}
        summary={`${shaped.stripes.length} intervals from ${labels.start} to ${labels.end}, ${shaped.averagePercent}% active overall.`}
      />
    </ActivityCard>
  );
}
