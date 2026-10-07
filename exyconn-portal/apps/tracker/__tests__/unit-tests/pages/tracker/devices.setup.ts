import { NetworkStatus } from '@apollo/client';
import type { Mock } from 'vitest';
import { deviceRow, isoAgo, queryResult, settingsRow } from './tracker.fixtures';

/** The generated hooks the devices console and its timezone lookup read, plus its callbacks. */
export type DevicesState = Record<
  'devices' | 'revoke' | 'settings' | 'access' | 'refetch' | 'revokeDevice',
  Mock
>;

/** One device online now, one gone quiet, one revoked a moment ago. */
export function devices() {
  return [
    deviceRow({ id: 'row-1', deviceId: 'dev-1', lastSeenAt: isoAgo(10_000) }),
    deviceRow({
      id: 'row-2',
      deviceId: 'dev-2',
      userId: 'u2',
      hostname: 'dev-thinkpad',
      platform: 'win32',
      osName: 'Windows',
      osVersion: '11',
      timezone: 'Asia/Dubai',
      lastSeenAt: isoAgo(60 * 60_000),
    }),
    deviceRow({
      id: 'row-3',
      deviceId: 'dev-3',
      userId: 'u3',
      hostname: 'old-imac',
      lastSeenAt: isoAgo(5_000),
      isActive: false,
    }),
  ];
}

/** Answers with the three devices, loaded, and no workspace default timezone. */
export function answerDevices(state: DevicesState, overrides: object = {}) {
  Object.values(state).forEach((fn) => fn.mockReset());
  state.refetch.mockResolvedValue({});
  state.revokeDevice.mockResolvedValue({ data: {} });
  state.devices.mockReturnValue(
    queryResult({ trackerDevices: devices() }, false, {
      refetch: state.refetch,
      networkStatus: NetworkStatus.ready,
      ...overrides,
    }),
  );
  state.revoke.mockReturnValue([state.revokeDevice]);
  state.settings.mockReturnValue(
    queryResult({ trackerSettings: settingsRow({ defaultTimezone: '' }) }),
  );
  state.access.mockReturnValue(queryResult({ trackerAccessList: [] }));
}
