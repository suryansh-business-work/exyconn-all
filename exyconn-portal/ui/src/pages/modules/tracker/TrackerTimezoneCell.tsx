import { Text } from '@/components/ui';
import { timezoneMeta, type TimezoneResolution } from './tracker.timezone';

interface TrackerTimezoneCellProps {
  resolution: TimezoneResolution;
}

/**
 * An employee's effective tracker timezone plus *why* they are on it — "chosen" when they
 * picked it themselves, otherwise the fallback that won (workspace default / device / UTC).
 */
export function TrackerTimezoneCell({ resolution }: Readonly<TrackerTimezoneCellProps>) {
  return (
    <>
      <Text size="sm" weight="medium" component="div">
        {resolution.timezone}
      </Text>
      <Text size="caption" color="text.secondary" component="div">
        {timezoneMeta(resolution)}
      </Text>
    </>
  );
}
