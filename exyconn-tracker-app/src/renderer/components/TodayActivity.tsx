import type { ReactElement } from 'react';
import { zonedToday } from '@exyconn/tracker-core';
import useMyDay from '../hooks/useMyDay';
import DayActivityChart from './DayActivityChart';

interface Props {
  timezone: string;
  /** Re-reads the day whenever a sync lands, since that is when new intervals exist. */
  lastSyncAt: string | null;
}

/** Today's synced intervals on the dashboard, in the employee's own zone. */
export default function TodayActivity({ timezone, lastSyncAt }: Readonly<Props>): ReactElement {
  const { detail, loading } = useMyDay(zonedToday(timezone), timezone, lastSyncAt);
  return (
    <DayActivityChart
      title="Today’s activity"
      detail={detail}
      loading={loading}
      timezone={timezone}
    />
  );
}
