import { describe, expect, it, vi } from 'vitest';
import { hostname as osHostname } from 'node:os';

const { fakeApp } = vi.hoisted(() => ({ fakeApp: { name: 'electron-app' } }));
vi.mock('electron', () => ({ app: fakeApp }));

import { app, hostname } from '../../../src/main/platform';

describe('platform', () => {
  it('hands out Electron’s app and the OS hostname from one place', () => {
    expect(app).toBe(fakeApp);
    expect(hostname()).toBe(osHostname());
  });
});
