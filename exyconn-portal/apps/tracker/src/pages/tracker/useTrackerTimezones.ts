import { useCallback, useMemo } from 'react';
import {
  useTrackerAccessListQuery,
  useTrackerDevicesQuery,
  useTrackerSettingsQuery,
} from '@exyconn/shell/graphql/generated';
import { resolveTimezone, type TimezoneResolution } from './tracker.timezone';
import type { TrackerDeviceRow } from '@exyconn/shell/pages/tracker-view/tracker.types';

/** The device whose zone stands in for an employee: their most recently seen active one. */
function latestDeviceZoneByUser(devices: readonly TrackerDeviceRow[]): Map<string, string> {
  const seenAt = new Map<string, number>();
  const zones = new Map<string, string>();
  for (const device of devices) {
    if (!device.isActive) continue;
    const at = new Date(device.lastSeenAt).getTime();
    const best = seenAt.get(device.userId);
    if (best !== undefined && best >= at) continue;
    seenAt.set(device.userId, at);
    zones.set(device.userId, device.timezone);
  }
  return zones;
}

/**
 * Resolves each employee's effective tracker timezone from the three sources the server reads:
 * their own pick (`TrackerAccess.timezone`), the workspace default (`TrackerSettings`), and the
 * zone their device reported. One source of truth — the resolution rule itself lives in
 * `tracker.timezone.ts` and mirrors the server's.
 */
export function useTrackerTimezones() {
  const settingsQuery = useTrackerSettingsQuery({ fetchPolicy: 'cache-first' });
  const accessQuery = useTrackerAccessListQuery({ fetchPolicy: 'cache-first' });
  const devicesQuery = useTrackerDevicesQuery({ fetchPolicy: 'cache-first' });

  const defaultTimezone = settingsQuery.data?.trackerSettings.defaultTimezone ?? '';
  const accessList = accessQuery.data?.trackerAccessList;
  const devices = devicesQuery.data?.trackerDevices;

  const chosenByUser = useMemo(
    () => new Map((accessList ?? []).map((entry) => [entry.userId, entry.timezone])),
    [accessList],
  );
  const deviceZoneByUser = useMemo(() => latestDeviceZoneByUser(devices ?? []), [devices]);

  /**
   * The effective zone for one employee. `deviceTimezone` overrides the "latest device" lookup
   * when the caller already knows which device it is talking about.
   */
  const timezoneFor = useCallback(
    (userId: string, deviceTimezone?: string): TimezoneResolution =>
      resolveTimezone({
        employeeTimezone: chosenByUser.get(userId),
        defaultTimezone,
        deviceTimezone: deviceTimezone ?? deviceZoneByUser.get(userId),
      }),
    [chosenByUser, defaultTimezone, deviceZoneByUser],
  );

  return { timezoneFor, workspaceTimezone: defaultTimezone };
}
