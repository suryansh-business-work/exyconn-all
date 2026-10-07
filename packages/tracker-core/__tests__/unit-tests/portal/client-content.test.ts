import { afterEach, describe, expect, it, vi } from 'vitest';
import type { AppLogBatchInput } from '../../../src/graphql/generated';
import type { ManualEntryDraft } from '../../../src/types';
import { clientWith, nextToken, respond, sent } from './portal-fixture';

afterEach(() => {
  vi.unstubAllGlobals();
});

const FROM = '2026-03-01T00:00:00.000Z';
const TO = '2026-03-08T00:00:00.000Z';

const logBatch: AppLogBatchInput = {
  app: 'tracker',
  appVersion: '1.2.3',
  deviceId: null,
  deviceModel: null,
  entries: [],
  osVersion: null,
  platform: 'macos',
  sessionId: null,
  source: 'DESKTOP',
  user: null,
};

describe('portal client — unauthenticated reads', () => {
  it('sends a log batch with the token when signed in', async () => {
    const token = nextToken();
    respond(200, { data: { reportClientLogs: true } });
    await expect(clientWith(token).reportClientLogs(logBatch)).resolves.toBe(true);

    expect(sent().authorization).toBe(`Bearer ${token}`);
    expect(sent().variables).toEqual({ input: logBatch });
  });

  it('still sends a log batch from the login screen, with no Authorization header', async () => {
    respond(200, { data: { reportClientLogs: false } });
    await expect(clientWith(null).reportClientLogs(logBatch)).resolves.toBe(false);
    expect(sent().authorization).toBeNull();
  });

  it('keys a locale bundle by its English source', async () => {
    respond(200, {
      data: {
        localeBundle: {
          translations: [
            { source: 'Start', text: 'Starten' },
            { source: 'Stop', text: 'Stoppen' },
          ],
        },
      },
    });
    await expect(clientWith(nextToken()).fetchTranslations('de')).resolves.toEqual({
      Start: 'Starten',
      Stop: 'Stoppen',
    });
    expect(sent().authorization).toBeNull();
    expect(sent().variables).toEqual({ locale: 'de' });
  });

  it('answers only what the portal managed to machine-translate', async () => {
    respond(200, { data: { translateMissing: [{ source: 'Pause', text: 'Pausieren' }] } });
    await expect(clientWith(null).translateMissing('de', ['Pause', 'Resume'])).resolves.toEqual({
      Pause: 'Pausieren',
    });
    expect(sent().variables).toEqual({ locale: 'de', sources: ['Pause', 'Resume'] });
  });

  it('fetches the public branding without a token', async () => {
    const branding = { name: 'Exyconn', logoUrl: null };
    respond(200, { data: { publicBranding: branding } });
    await expect(clientWith(null).fetchBranding()).resolves.toEqual(branding);
    expect(sent().variables).toEqual({});
  });
});

describe('portal client — the employee’s own reports', () => {
  it('asks for the calendar in the zone the app computed it in', async () => {
    const days = [{ date: '2026-03-02', activeMs: 10, idleMs: 0 }];
    respond(200, { data: { myTrackerCalendar: days } });
    await expect(clientWith(nextToken()).fetchMyReport(FROM, TO, 'Asia/Kolkata')).resolves.toEqual(
      days,
    );
    expect(sent().variables).toEqual({ from: FROM, to: TO, timezone: 'Asia/Kolkata' });
  });

  it('summarises one day of work', async () => {
    respond(200, {
      data: {
        myTrackerDay: {
          intervals: [
            {
              startedAt: FROM,
              endedAt: TO,
              activeMs: 300,
              idleMs: 100,
              keyCount: 5,
              mouseCount: 6,
              activityPercent: 75,
            },
          ],
          screenshots: [],
          sessions: [{ id: 's-1' }],
        },
      },
    });
    const day = await clientWith(nextToken()).fetchMyDay(FROM, TO);
    expect(day).toMatchObject({ activeMs: 300, idleMs: 100, keyCount: 5, sessions: 1 });
    expect(sent().variables).toEqual({ start: FROM, end: TO });
  });

  it('lists the zones the server resolves', async () => {
    respond(200, { data: { trackerTimezones: ['UTC', 'Asia/Kolkata'] } });
    await expect(clientWith(nextToken()).fetchTimezones()).resolves.toEqual([
      'UTC',
      'Asia/Kolkata',
    ]);
  });

  it('answers the latest release, or null before one exists', async () => {
    const release = { version: '2.0.0', url: 'https://r', publishedAt: FROM, assets: [] };
    respond(200, { data: { trackerLatestRelease: release } });
    await expect(clientWith(nextToken()).fetchLatestRelease('macos')).resolves.toEqual(release);
    expect(sent().variables).toEqual({ platform: 'macos' });

    respond(200, { data: { trackerLatestRelease: null } });
    await expect(clientWith(nextToken()).fetchLatestRelease('ios')).resolves.toBeNull();
  });
});

describe('portal client — manual entries', () => {
  const entry = { id: 'm-1', status: 'PENDING' };

  it('lists the employee’s own claims for a range', async () => {
    respond(200, { data: { myTrackerManualEntries: [entry] } });
    await expect(clientWith(nextToken()).fetchManualEntries(FROM, TO)).resolves.toEqual([entry]);
    expect(sent().variables).toEqual({ from: FROM, to: TO });
  });

  it('files a claim with its project and ticket', async () => {
    respond(200, { data: { createTrackerManualEntry: entry } });
    const draft: ManualEntryDraft = {
      projectId: 'p-1',
      taskId: 't-1',
      startedAt: FROM,
      endedAt: TO,
      note: 'Client call',
    };
    await expect(clientWith(nextToken()).createManualEntry(draft)).resolves.toEqual(entry);
    expect(sent().variables).toEqual({ input: draft });
  });

  it('sends null for an empty project and ticket (the Global Project, no ticket)', async () => {
    respond(200, { data: { createTrackerManualEntry: entry } });
    await clientWith(nextToken()).createManualEntry({
      projectId: '',
      taskId: '',
      startedAt: FROM,
      endedAt: TO,
      note: '',
    });
    expect(sent().variables).toEqual({
      input: { projectId: null, taskId: null, startedAt: FROM, endedAt: TO, note: '' },
    });
  });

  it('withdraws a pending claim', async () => {
    respond(200, { data: { withdrawTrackerManualEntry: true } });
    await expect(clientWith(nextToken()).withdrawManualEntry('m-1')).resolves.toBeUndefined();
    expect(sent().variables).toEqual({ id: 'm-1' });
  });
});

describe('portal client — messages', () => {
  const message = { id: 'msg-1', kind: 'CHAT', body: 'Hi' };

  it('fetches a thread by kind', async () => {
    respond(200, { data: { myTrackerMessages: [message] } });
    await expect(clientWith(nextToken()).fetchMessages('CHAT')).resolves.toEqual([message]);
    expect(sent().variables).toEqual({ kind: 'CHAT' });
  });

  it('posts one line and answers the stored message', async () => {
    respond(200, { data: { sendMyTrackerMessage: message } });
    await expect(clientWith(nextToken()).sendMessage('Hi')).resolves.toEqual(message);
    expect(sent().variables).toEqual({ body: 'Hi' });
  });

  it('marks a kind read and answers how many it marked', async () => {
    respond(200, { data: { markMyTrackerMessagesRead: 3 } });
    await expect(clientWith(nextToken()).markMessagesRead('NOTICE')).resolves.toBe(3);
    expect(sent().variables).toEqual({ kind: 'NOTICE' });
  });
});
