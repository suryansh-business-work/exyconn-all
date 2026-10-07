import type { AuthUser, TrackerLoggerConfig } from '@exyconn/tracker-core';
import { describe, expect, it, vi } from 'vitest';
import { loadedDeviceInfo } from '../../../src/tracker/device-info';
import { logger, setLogUser } from '../../../src/tracker/logger';
import { portal } from '../../../src/tracker/platform/shared';
import { fileSystemTest } from '../mocks/expo-file-system';

const created = vi.hoisted(() => ({ config: null as TrackerLoggerConfig | null }));

vi.mock('@exyconn/tracker-core', () => ({
  createTrackerLogger: (config: TrackerLoggerConfig) => {
    created.config = config;
    return { name: 'tracker-logger' };
  },
}));
vi.mock('../../../src/tracker/device-info', () => ({ loadedDeviceInfo: () => null }));
vi.mock('../../../src/tracker/platform/shared', () => ({
  portal: { reportClientLogs: () => Promise.resolve(true) },
}));

function config(): TrackerLoggerConfig {
  if (created.config === null) {
    throw new Error('The logger was not created at import.');
  }
  return created.config;
}

describe('the phone’s logger', () => {
  it('reports as the mobile tracker, through the shared portal client', () => {
    expect(logger).toEqual({ name: 'tracker-logger' });
    expect(config()).toMatchObject({ source: 'MOBILE', app: 'tracker-mobile' });
    expect(config().portal).toBe(portal);
    expect(config().device).toBe(loadedDeviceInfo);
  });

  it('names whoever the root layout says is signed in', () => {
    expect(config().user()).toBeNull();
    const user: AuthUser = { id: 'u1', name: 'Asha Rao', email: 'asha@example.test' };
    setLogUser(user);
    expect(config().user()).toBe(user);
    setLogUser(null);
    expect(config().user()).toBeNull();
  });

  it('queues logs in a file, so a crash cannot lose them', () => {
    config().storage.write('[{"message":"boom"}]');
    expect(fileSystemTest.files.get('file:///document/tracker-logs.json')).toBe(
      '[{"message":"boom"}]',
    );
    expect(config().storage.read()).toBe('[{"message":"boom"}]');
  });
});
