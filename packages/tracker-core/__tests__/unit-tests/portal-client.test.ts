import { afterEach, describe, expect, it, vi } from 'vitest';
import { createPortalClient } from '../../src/portal/client';
import { TrackerAuthError, TrackerRejectedError } from '../../src/portal/portal-error';

const URL = 'https://portal.test/graphql';

function respond(status: number, body: unknown): void {
  vi.stubGlobal(
    'fetch',
    vi.fn(() => Promise.resolve(new Response(JSON.stringify(body), { status }))),
  );
}

function client(token: string | null = 'device-token') {
  return createPortalClient({ url: URL, getToken: () => token });
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('createPortalClient', () => {
  it('sends the codegen document as its query text, with the device token', async () => {
    respond(200, {
      data: { myTrackerTotals: { activeMs: 1, idleMs: 2, screenshots: 3, sessions: 4 } },
    });

    await expect(client().fetchMyTotals()).resolves.toEqual({
      activeMs: 1,
      idleMs: 2,
      screenshots: 3,
      sessions: 4,
    });

    const [url, init] = vi.mocked(fetch).mock.calls[0];
    expect(url).toBe(URL);
    expect(new Headers(init?.headers).get('Authorization')).toBe('Bearer device-token');
    expect(JSON.parse(String(init?.body)).query).toContain('myTrackerTotals');
  });

  it('refuses an authenticated call with no token, without touching the network', async () => {
    respond(200, {});
    await expect(client(null).fetchMyTotals()).rejects.toBeInstanceOf(TrackerAuthError);
    expect(fetch).not.toHaveBeenCalled();
  });

  it('turns an auth error code into TrackerAuthError, so the app signs itself out', async () => {
    respond(200, {
      errors: [{ message: 'Device revoked', extensions: { code: 'UNAUTHENTICATED' } }],
    });
    await expect(client().trackerMe()).rejects.toThrow(TrackerAuthError);
  });

  it('treats a permanent rejection as TrackerRejectedError, so the outbox drops it', async () => {
    respond(200, { errors: [{ message: 'Too large', extensions: { code: 'BAD_USER_INPUT' } }] });
    await expect(
      client().uploadScreenshot({
        sessionId: 's',
        intervalStartedAt: 'a',
        capturedAt: 'a',
        image: '',
        displayId: '0',
        blurred: false,
      }),
    ).rejects.toThrow(TrackerRejectedError);
  });

  it('puts the HTTP status in the message of a transient failure', async () => {
    respond(503, { errors: [{ message: 'busy' }] });
    await expect(client().fetchMyTotals()).rejects.toThrow('HTTP 503 — busy');
  });

  it('narrows an unknown webcam corner to the portal default', async () => {
    const settings = {
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
      webcamCorner: 'middle',
      syncIntervalMinutes: 5,
      consentText: '',
      autoStartEnabled: false,
      autoStartHour: 9,
      autoStopHour: 18,
    };
    respond(200, {
      data: {
        trackerLogin: {
          token: 't',
          consentRequired: false,
          user: { id: 'u', name: 'N', email: 'e' },
          settings,
        },
      },
    });

    const result = await client(null).login('e', 'p', {
      deviceId: 'd',
      platform: 'android',
      hostname: '',
      appVersion: '1.0.0',
      machineId: '',
      osName: 'Android',
      osVersion: '15',
      arch: '',
      cpuModel: '',
      cpuCores: 0,
      totalMemoryMb: 0,
      locale: 'en-IN',
      timezone: 'Asia/Kolkata',
      screenCount: 1,
      screenResolution: '1080x2400',
    });

    expect(result.settings.webcamCorner).toBe('bottom-right');
  });
});
