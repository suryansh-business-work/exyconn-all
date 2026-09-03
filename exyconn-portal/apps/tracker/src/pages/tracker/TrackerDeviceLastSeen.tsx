import { Chip, Stack, Text } from '@exyconn/shell/components/ui';
import { isDeviceOnline } from '@exyconn/shell/pages/tracker-view/tracker.format';
import type { DateTimeFormatter } from '@exyconn/shell/pages/tracker-view/tracker.types';

interface TrackerDeviceLastSeenProps {
  lastSeenAt: string;
  /** A revoked device's last check-in is history, never "online". */
  isActive: boolean;
  formatDateTime: DateTimeFormatter;
}

/**
 * When a device last checked in — and whether it is checking in right now. The desktop app
 * heartbeats once a minute while it is signed in, so a green chip here means somebody has
 * the tracker open, not merely that they once installed it.
 */
export function TrackerDeviceLastSeen({
  lastSeenAt,
  isActive,
  formatDateTime,
}: Readonly<TrackerDeviceLastSeenProps>) {
  const online = isActive && isDeviceOnline(lastSeenAt);
  return (
    <Stack direction="row" spacing={1} alignItems="center">
      {online && <Chip label="Online" size="small" color="success" />}
      <Text size="sm" color={online ? 'text.primary' : 'text.secondary'}>
        {formatDateTime(lastSeenAt)}
      </Text>
    </Stack>
  );
}
