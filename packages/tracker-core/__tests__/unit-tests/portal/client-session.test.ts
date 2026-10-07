import { afterEach, describe, expect, it, vi } from 'vitest';
import type { IntervalPayload } from '../../../src/types';
import { clientWith, device, nextToken, rawSettings, respond, sent } from './portal-fixture';

afterEach(() => {
  vi.unstubAllGlobals();
});

const STARTED = '2026-03-02T09:00:00.000Z';
const ENDED = '2026-03-02T10:00:00.000Z';

function meFields(corner: string) {
  return {
    user: { id: 'u-1', name: 'Asha', email: 'asha@example.com' },
    consentRequired: false,
    timezone: 'Asia/Kolkata',
    locale: 'en-IN',
    settings: rawSettings(corner),
    unreadMessages: 2,
  };
}

describe('portal client — sign-in', () => {
  it('signs in without a token and keeps a known webcam corner', async () => {
    const credential = nextToken();
    const issued = nextToken();
    respond(200, {
      data: {
        trackerLogin: {
          token: issued,
          consentRequired: true,
          user: { id: 'u-1', name: 'Asha', email: 'asha@example.com' },
          settings: rawSettings('top-left'),
        },
      },
    });

    const result = await clientWith(nextToken()).login('asha@example.com', credential, device());

    expect(result.token).toBe(issued);
    expect(result.consentRequired).toBe(true);
    expect(result.settings.webcamCorner).toBe('top-left');
    expect(sent().authorization).toBeNull();
    expect(sent().variables).toEqual({
      email: 'asha@example.com',
      password: credential,
      device: device(),
    });
  });

  it('rebuilds a remembered session, narrowing the settings', async () => {
    respond(200, { data: { trackerMe: meFields('sideways') } });

    const me = await clientWith(nextToken()).trackerMe();

    expect(me.settings.webcamCorner).toBe('bottom-right');
    expect(me.timezone).toBe('Asia/Kolkata');
    expect(me.unreadMessages).toBe(2);
    expect(sent().query).toContain('trackerMe');
  });

  it('heartbeats with the device and answers the same shape as trackerMe', async () => {
    respond(200, { data: { trackerHeartbeat: meFields('top-right') } });

    const me = await clientWith(nextToken()).heartbeat(device());

    expect(me.settings.webcamCorner).toBe('top-right');
    expect(me.user.name).toBe('Asha');
    expect(sent().variables).toEqual({ device: device() });
  });
});

describe('portal client — the working day', () => {
  it('records the picked timezone and answers what the portal stored', async () => {
    respond(200, { data: { trackerSetTimezone: { timezone: 'Europe/Berlin' } } });
    await expect(clientWith(nextToken()).setTimezone('Europe/Berlin')).resolves.toBe(
      'Europe/Berlin',
    );
    expect(sent().variables).toEqual({ timezone: 'Europe/Berlin' });
  });

  it('accepts consent with the typed signature only', async () => {
    respond(200, { data: { trackerAcceptConsent: true } });
    await expect(clientWith(nextToken()).acceptConsent('Asha Rao')).resolves.toBeUndefined();
    expect(sent().variables).toEqual({ signedName: 'Asha Rao' });
  });

  it('marks attendance and returns the workday', async () => {
    const workday = { date: '2026-03-02', status: 'PRESENT', note: null };
    respond(200, { data: { trackerMarkAttendance: workday } });
    await expect(clientWith(nextToken()).markAttendance('PRESENT', null)).resolves.toEqual(workday);
    expect(sent().variables).toEqual({ status: 'PRESENT', note: null });
  });

  it('starts a session and answers its id', async () => {
    respond(200, { data: { trackerStartSession: { id: 'sess-9' } } });
    await expect(clientWith(nextToken()).startSession(STARTED, 'p-1', 't-1')).resolves.toBe(
      'sess-9',
    );
    expect(sent().variables).toEqual({ startedAt: STARTED, projectId: 'p-1', taskId: 't-1' });
  });

  it('stops a session', async () => {
    respond(200, { data: { trackerStopSession: { id: 'sess-9' } } });
    await expect(clientWith(nextToken()).stopSession('sess-9', ENDED)).resolves.toBeUndefined();
    expect(sent().variables).toEqual({ sessionId: 'sess-9', endedAt: ENDED });
  });

  it('lists the tasks for a project', async () => {
    const tasks = [{ id: 't-1', title: 'Fix login', key: 'APP-1' }];
    respond(200, { data: { trackerTaskOptions: tasks } });
    await expect(clientWith(nextToken()).fetchTasks('p-1')).resolves.toEqual(tasks);
    expect(sent().variables).toEqual({ projectId: 'p-1' });
  });

  it('syncs intervals against their session', async () => {
    respond(200, { data: { trackerSyncIntervals: 1 } });
    const intervals: IntervalPayload[] = [
      {
        startedAt: STARTED,
        endedAt: ENDED,
        keyCount: 3,
        mouseCount: 4,
        activeMs: 1,
        idleMs: 2,
        windows: [{ appName: 'Code', windowTitle: 'client.ts', durationMs: 1 }],
      },
    ];
    await expect(
      clientWith(nextToken()).syncIntervals('sess-9', intervals),
    ).resolves.toBeUndefined();
    expect(sent().variables).toEqual({ sessionId: 'sess-9', intervals });
  });

  it('uploads a screenshot', async () => {
    respond(200, { data: { trackerUploadScreenshot: { id: 'shot-1' } } });
    const input = {
      sessionId: 'sess-9',
      intervalStartedAt: STARTED,
      capturedAt: STARTED,
      image: 'aGk=',
      displayId: '0',
      blurred: true,
    };
    await expect(clientWith(nextToken()).uploadScreenshot(input)).resolves.toBeUndefined();
    expect(sent().variables).toEqual({ input });
  });

  it('records presence with its note', async () => {
    const presence = { status: 'BREAK', note: 'Lunch', updatedAt: STARTED };
    respond(200, { data: { setMyTrackerPresence: presence } });
    await expect(clientWith(nextToken()).setPresence('BREAK', 'Lunch')).resolves.toEqual(presence);
    expect(sent().variables).toEqual({ status: 'BREAK', note: 'Lunch' });
  });
});
