import { beforeEach, describe, expect, it, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import type { TrackerDeviceRow } from '@exyconn/shell/pages/tracker-view/tracker.types';
import { useTrackerTimezones } from '../../../../src/pages/tracker/useTrackerTimezones';
import { accessRow, deviceRow, queryResult, settingsRow } from './tracker.fixtures';

const gql = vi.hoisted(() => ({ settings: vi.fn(), access: vi.fn(), devices: vi.fn() }));

vi.mock('@exyconn/shell/graphql/generated', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@exyconn/shell/graphql/generated')>()),
  useTrackerSettingsQuery: gql.settings,
  useTrackerAccessListQuery: gql.access,
  useTrackerDevicesQuery: gql.devices,
}));

function answer(defaultTimezone: string | null, chosen: string[][], devices: TrackerDeviceRow[]) {
  gql.settings.mockReturnValue(
    queryResult(
      defaultTimezone === null ? undefined : { trackerSettings: settingsRow({ defaultTimezone }) },
    ),
  );
  gql.access.mockReturnValue(
    queryResult({
      trackerAccessList: chosen.map(([userId, timezone]) =>
        accessRow({ id: `a-${userId}`, userId, timezone }),
      ),
    }),
  );
  gql.devices.mockReturnValue(queryResult({ trackerDevices: devices }));
}

describe('useTrackerTimezones', () => {
  beforeEach(() => {
    gql.settings.mockReset();
    gql.access.mockReset();
    gql.devices.mockReset();
  });

  it('reads all three sources from the cache first', () => {
    answer('', [], []);
    renderHook(() => useTrackerTimezones());
    expect(gql.settings).toHaveBeenCalledWith({ fetchPolicy: 'cache-first' });
    expect(gql.access).toHaveBeenCalledWith({ fetchPolicy: 'cache-first' });
    expect(gql.devices).toHaveBeenCalledWith({ fetchPolicy: 'cache-first' });
  });

  it("puts an employee's own pick ahead of the workspace default", () => {
    answer('Asia/Kolkata', [['u1', 'Europe/London']], []);
    const { result } = renderHook(() => useTrackerTimezones());
    expect(result.current.workspaceTimezone).toBe('Asia/Kolkata');
    expect(result.current.timezoneFor('u1')).toEqual({
      timezone: 'Europe/London',
      source: 'chosen',
    });
    expect(result.current.timezoneFor('u2')).toEqual({
      timezone: 'Asia/Kolkata',
      source: 'workspace',
    });
  });

  it("falls back to the zone of the employee's most recently seen active device", () => {
    answer(
      '',
      [],
      [
        deviceRow({ id: 'old', timezone: 'America/New_York', lastSeenAt: '2026-01-10T00:00:00Z' }),
        deviceRow({ id: 'new', timezone: 'Europe/Paris', lastSeenAt: '2026-01-12T00:00:00Z' }),
        deviceRow({ id: 'older', timezone: 'Asia/Tokyo', lastSeenAt: '2026-01-01T00:00:00Z' }),
        deviceRow({
          id: 'revoked',
          timezone: 'Australia/Sydney',
          lastSeenAt: '2026-02-01T00:00:00Z',
          isActive: false,
        }),
      ],
    );
    const { result } = renderHook(() => useTrackerTimezones());
    expect(result.current.timezoneFor('u1')).toEqual({
      timezone: 'Europe/Paris',
      source: 'device',
    });
  });

  it('keeps the first device when two were last seen at the same moment', () => {
    const seen = '2026-01-12T00:00:00Z';
    answer(
      '',
      [],
      [
        deviceRow({ id: 'first', timezone: 'Europe/Berlin', lastSeenAt: seen }),
        deviceRow({ id: 'second', timezone: 'Europe/Madrid', lastSeenAt: seen }),
      ],
    );
    const { result } = renderHook(() => useTrackerTimezones());
    expect(result.current.timezoneFor('u1').timezone).toBe('Europe/Berlin');
  });

  it('uses the device the caller names over the latest-device lookup', () => {
    answer('', [], [deviceRow({ timezone: 'Europe/Paris' })]);
    const { result } = renderHook(() => useTrackerTimezones());
    expect(result.current.timezoneFor('u1', 'Asia/Dubai')).toEqual({
      timezone: 'Asia/Dubai',
      source: 'device',
    });
  });

  it('lands on UTC while nothing has loaded, with no workspace default to show', () => {
    gql.settings.mockReturnValue(queryResult(undefined, true));
    gql.access.mockReturnValue(queryResult(undefined, true));
    gql.devices.mockReturnValue(queryResult(undefined, true));
    const { result } = renderHook(() => useTrackerTimezones());
    expect(result.current.workspaceTimezone).toBe('');
    expect(result.current.timezoneFor('u1')).toEqual({ timezone: 'UTC', source: 'fallback' });
  });

  it('ignores an unresolvable device zone', () => {
    answer(null, [], [deviceRow({ timezone: 'Not/A_Zone' })]);
    const { result } = renderHook(() => useTrackerTimezones());
    expect(result.current.timezoneFor('u1').source).toBe('fallback');
  });
});
