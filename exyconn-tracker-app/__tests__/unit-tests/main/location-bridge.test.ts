import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { BrowserWindow } from 'electron';
import { IPC, type LocationRequest, type LocationResult } from '@shared/types';
import type { TrackerLocationInput } from '@exyconn/tracker-core';

type Listener = (event: unknown, result: LocationResult) => void;

const { listeners, windowsFix } = vi.hoisted(() => ({
  listeners: new Map<string, Listener>(),
  windowsFix: vi.fn(),
}));

vi.mock('../../../src/main/windows-location', () => ({ readWindowsLocation: windowsFix }));

vi.mock('../../../src/main/web-security', () => ({
  onTrusted: (channel: string, fn: Listener) => listeners.set(channel, fn),
}));

import { registerLocationBridge, systemLocation } from '../../../src/main/location-bridge';

/** Arbitrary test coordinates. */
const FIX: TrackerLocationInput = {
  lat: 12.97,
  lng: 77.59,
  accuracyM: 30,
  source: 'SYSTEM',
  capturedAt: '2026-09-14T04:00:00.000Z',
};

/** A window whose renderer records the location requests it was sent. */
function rendererWindow(destroyed = false) {
  const send = vi.fn();
  const win = { isDestroyed: () => destroyed, webContents: { send } };
  return { win: win as unknown as BrowserWindow, send };
}

function answer(result: LocationResult): void {
  listeners.get(IPC.locationResult)?.({}, result);
}

function requestOf(send: ReturnType<typeof vi.fn>): LocationRequest {
  return send.mock.calls[0][1] as LocationRequest;
}

beforeEach(() => {
  vi.useFakeTimers();
  registerLocationBridge();
});

afterEach(() => {
  vi.useRealTimers();
});

describe('systemLocation', () => {
  it('rejects at once when there is no live window to read the location through', async () => {
    await expect(systemLocation(() => null).current()).rejects.toThrow(
      'No tracker window to read the location from',
    );
    const { win, send } = rendererWindow(true);
    await expect(systemLocation(() => win).current()).rejects.toThrow(
      'No tracker window to read the location from',
    );
    expect(send).not.toHaveBeenCalled();
  });

  it('asks the current window’s renderer with a fresh id and resolves with its fix', async () => {
    const { win, send } = rendererWindow();

    const fix = systemLocation(() => win).current();
    const request = requestOf(send);
    expect(send).toHaveBeenCalledWith(IPC.locationRequested, { id: request.id });
    expect(request.id).toMatch(/^[\da-f-]{36}$/);

    answer({ id: request.id, location: FIX, error: null });

    await expect(fix).resolves.toEqual(FIX);
  });

  it('rejects with the renderer’s reason when no fix could be read', async () => {
    const { win, send } = rendererWindow();

    const fix = systemLocation(() => win).current();
    answer({ id: requestOf(send).id, location: null, error: 'Geolocation failed (code 1)' });

    await expect(fix).rejects.toThrow('Geolocation failed (code 1)');
  });

  it('says so when the renderer gave no reason', async () => {
    const { win, send } = rendererWindow();

    const fix = systemLocation(() => win).current();
    answer({ id: requestOf(send).id, location: null, error: null });

    await expect(fix).rejects.toThrow('The location could not be read');
  });

  it('gives up after twenty seconds, and ignores an answer that comes too late', async () => {
    const { win, send } = rendererWindow();

    const fix = systemLocation(() => win).current();
    const settled = expect(fix).rejects.toThrow('Reading the location timed out');
    vi.advanceTimersByTime(19_999);
    vi.advanceTimersByTime(1);

    await settled;
    expect(() => answer({ id: requestOf(send).id, location: FIX, error: null })).not.toThrow();
  });

  it('keeps concurrent requests apart by id and ignores unknown ids', async () => {
    const first = rendererWindow();
    const second = rendererWindow();
    const moved = { ...FIX, lat: 13.5 };

    const a = systemLocation(() => first.win).current();
    const b = systemLocation(() => second.win).current();
    answer({ id: 'not-a-request', location: FIX, error: null });
    answer({ id: requestOf(second.send).id, location: moved, error: null });
    answer({ id: requestOf(first.send).id, location: FIX, error: null });

    await expect(Promise.all([a, b])).resolves.toEqual([FIX, moved]);
  });
});

describe('systemLocation on Windows', () => {
  it('reads Windows Location Services in main instead of asking the window', async () => {
    const realPlatform = process.platform;
    Object.defineProperty(process, 'platform', { value: 'win32', configurable: true });
    windowsFix.mockResolvedValue(FIX);
    const { win, send } = rendererWindow();
    try {
      await expect(systemLocation(() => win).current()).resolves.toEqual(FIX);
    } finally {
      Object.defineProperty(process, 'platform', { value: realPlatform, configurable: true });
    }
    expect(send).not.toHaveBeenCalled();
  });
});
