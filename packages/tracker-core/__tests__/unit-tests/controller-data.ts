import type { LoginResponse, TrackerMeResponse } from '../../src/portal/client';
import type { DeviceInfo, Workday } from '../../src/types';
import { ENGINE_SETTINGS } from './engine-fixture';

export const WORKDAY: Workday = {
  date: '2026-02-03',
  targetMs: 8 * 3_600_000,
  activeMs: 600_000,
  attendanceStatus: 'PRESENT',
  attendanceNote: null,
  attendanceMarked: true,
};

/** What the portal says about the signed-in employee; override per test. */
export function me(overrides: Partial<TrackerMeResponse> = {}): TrackerMeResponse {
  return {
    user: { id: 'u1', name: 'Asha Rao', email: 'asha@example.com' },
    consentRequired: false,
    settings: ENGINE_SETTINGS,
    timezone: 'UTC',
    locale: 'en-US',
    workProfile: {
      workingTime: 'FIXED',
      workingTimeNote: '',
      workLocation: 'OFFICE',
      workLocationNote: '',
      workHoursPerDay: 8,
      targetMs: 8 * 3_600_000,
    },
    workday: WORKDAY,
    projects: [
      { id: 'global', name: 'Global Project', key: 'GLB' },
      { id: 'p2', name: 'Website', key: 'WEB' },
    ],
    consentPolicy: null,
    presence: { status: 'WORKING', note: '', since: null },
    notices: [],
    unreadMessages: 0,
    ...overrides,
  };
}

/** A sign-in answer. The token is built at runtime, never written as a literal. */
export function loginResponse(overrides: Partial<LoginResponse> = {}): LoginResponse {
  return {
    token: `device-${Date.now()}`,
    user: { id: 'u1', name: 'Asha Rao', email: 'asha@example.com' },
    consentRequired: false,
    settings: ENGINE_SETTINGS,
    ...overrides,
  };
}

export const DEVICE: DeviceInfo = {
  deviceId: 'device-1',
  platform: 'darwin',
  hostname: 'laptop',
  appVersion: '1.0.0',
  machineId: 'machine-1',
  osName: 'macOS',
  osVersion: '15.0',
  arch: 'arm64',
  cpuModel: 'M3',
  cpuCores: 8,
  totalMemoryMb: 16_384,
  locale: 'en-US',
  timezone: 'UTC',
  screenCount: 1,
  screenResolution: '1920x1080',
};
