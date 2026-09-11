import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createPortalClient } from '../../src/portal/client';
import { createTrackerLogger } from '../../src/logger';
import type { DeviceInfo } from '../../src/types';

const URL = 'https://portal.test/graphql';

const device = {
  deviceId: 'install-1',
  platform: 'android',
  appVersion: '1.9.10',
  osVersion: '14',
  cpuModel: 'Pixel 7',
  arch: 'arm64-v8a',
} as DeviceInfo;

function memoryStorage() {
  let value: string | null = null;
  return { read: () => value, write: (next: string) => (value = next) };
}

beforeEach(() => {
  vi.useFakeTimers();
  vi.stubGlobal(
    'fetch',
    vi.fn(() =>
      Promise.resolve(new Response(JSON.stringify({ data: { reportClientLogs: true } }))),
    ),
  );
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

function sentBody() {
  const [, init] = vi.mocked(fetch).mock.calls[0];
  return { headers: new Headers(init?.headers), body: JSON.parse(String(init?.body)) };
}

describe('createTrackerLogger', () => {
  it('reports through the portal with the device and the signed-in user', async () => {
    const logger = createTrackerLogger({
      source: 'MOBILE',
      app: 'tracker-mobile',
      portal: createPortalClient({ url: URL, getToken: () => 'device-token' }),
      device: () => device,
      user: () => ({ id: 'u1', name: 'Asha', email: 'asha@exyconn.com' }),
      storage: memoryStorage(),
    });
    logger.error('Settings failed to render', new TypeError('boom'));
    await vi.runOnlyPendingTimersAsync();

    const { headers, body } = sentBody();
    expect(headers.get('Authorization')).toBe('Bearer device-token');
    expect(body.query).toContain('reportClientLogs');
    expect(body.variables.input).toMatchObject({
      source: 'MOBILE',
      app: 'tracker-mobile',
      appVersion: '1.9.10',
      platform: 'android',
      deviceModel: 'Pixel 7 arm64-v8a',
      user: { id: 'u1' },
    });
    expect(body.variables.input.entries[0]).toMatchObject({
      level: 'ERROR',
      message: 'Settings failed to render: boom',
      errorName: 'TypeError',
    });
  });

  it('still reports before sign-in and before the device is read', async () => {
    const logger = createTrackerLogger({
      source: 'DESKTOP',
      app: 'tracker-desktop',
      portal: createPortalClient({ url: URL, getToken: () => null }),
      device: () => null,
      user: () => null,
      storage: memoryStorage(),
    });
    logger.capture(new Error('crashed at launch'));
    await vi.runOnlyPendingTimersAsync();

    const { headers, body } = sentBody();
    expect(headers.get('Authorization')).toBeNull();
    expect(body.variables.input).toMatchObject({ appVersion: null, user: null });
  });
});
