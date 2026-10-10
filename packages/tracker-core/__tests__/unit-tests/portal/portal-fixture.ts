import { vi } from 'vitest';
import { createPortalClient } from '../../../src/portal/client';
import type { DeviceInfo } from '../../../src/types';

export const PORTAL_URL = 'https://portal.test/graphql';

let tokenCounter = 0;

/** A fresh device token per call, built at runtime so no credential literal lives in source. */
export function nextToken(): string {
  tokenCounter += 1;
  return `device-${tokenCounter}`;
}

/** Stubs fetch so every request answers with `body` (a fresh Response per call) and `status`. */
export function respond(status: number, body: unknown, statusText = ''): void {
  vi.stubGlobal(
    'fetch',
    vi.fn(() => Promise.resolve(new Response(JSON.stringify(body), { status, statusText }))),
  );
}

/** Stubs fetch with a raw (possibly non-JSON) body. */
export function respondRaw(status: number, body: string, statusText: string): void {
  vi.stubGlobal(
    'fetch',
    vi.fn(() => Promise.resolve(new Response(body, { status, statusText }))),
  );
}

export interface SentRequest {
  url: string;
  query: string;
  variables: Record<string, unknown>;
  authorization: string | null;
}

/** What the client posted on its `index`-th fetch. */
export function sent(index = 0): SentRequest {
  const [url, init] = vi.mocked(fetch).mock.calls[index];
  const body = JSON.parse(init?.body as string) as {
    query: string;
    variables: Record<string, unknown>;
  };
  return {
    url: url as string,
    query: body.query,
    variables: body.variables,
    authorization: new Headers(init?.headers).get('Authorization'),
  };
}

export function clientWith(token: string | null) {
  return createPortalClient({ url: PORTAL_URL, getToken: () => token });
}

/** The portal's settings payload, with `webcamCorner` as the plain String the schema types. */
export function rawSettings(webcamCorner: string) {
  return {
    intervalMinutes: 10,
    screenshotsPerInterval: 1,
    randomizeScreenshotTiming: true,
    blurScreenshots: false,
    trackWindowTitles: true,
    idleThresholdSeconds: 60,
    idleAutoPauseMinutes: 15,
    screenshotMaxWidth: 1280,
    screenshotQuality: 80,
    captureSoundEnabled: true,
    webcamEnabled: false,
    webcamCorner,
    syncIntervalMinutes: 5,
    consentText: '',
    autoStartEnabled: false,
    autoStartHour: 9,
    autoStopHour: 18,
  };
}

export function device(): DeviceInfo {
  return {
    deviceId: 'd-1',
    platform: 'macos',
    hostname: 'host',
    appVersion: '1.2.3',
    machineId: 'm-1',
    osName: 'macOS',
    osVersion: '15',
    arch: 'arm64',
    cpuModel: 'M3',
    cpuCores: 8,
    totalMemoryMb: 16384,
    locale: 'en-IN',
    timezone: 'Asia/Kolkata',
    screenCount: 1,
    screenResolution: '2560x1600',
  };
}
