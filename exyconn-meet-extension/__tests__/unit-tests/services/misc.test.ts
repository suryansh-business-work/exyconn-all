import type { LogBatch } from '@exyconn/logger';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { createExtensionLogger, LOG_APP, logTo } from '../../../src/services/logger';
import { askWorker, relayLogs } from '../../../src/services/messaging';
import { ACTIONS_PAGE_SIZE, createMeetApi } from '../../../src/services/meet-api';
import type { GraphqlClient } from '../../../src/services/api';
import { installChrome } from '../chrome-mock';

afterEach(() => vi.unstubAllGlobals());

describe('askWorker', () => {
  it('unwraps a successful reply', async () => {
    const chrome = installChrome();
    chrome.runtime.sendMessage.mockResolvedValue({ ok: true, data: 42 });
    await expect(askWorker({ type: 'i18n/messages' })).resolves.toBe(42);
    expect(chrome.runtime.sendMessage).toHaveBeenCalledWith({ type: 'i18n/messages' });
  });

  it('relays a log batch through the worker', async () => {
    const chrome = installChrome();
    chrome.runtime.sendMessage.mockResolvedValue({ ok: true, data: true });
    const batch: LogBatch = {
      source: 'PORTAL',
      app: 'a',
      sessionId: 's',
      user: null,
      entries: [],
      appVersion: null,
      platform: null,
      osVersion: null,
      deviceModel: null,
      deviceId: null,
    };
    await expect(relayLogs(batch)).resolves.toBe(true);
    expect(chrome.runtime.sendMessage).toHaveBeenCalledWith({ type: 'log/batch', batch });
  });

  it('throws the worker error or a missing reply', async () => {
    const chrome = installChrome();
    chrome.runtime.sendMessage.mockResolvedValueOnce({ ok: false, error: 'Join the call first' });
    await expect(askWorker({ type: 'capture/consent' })).rejects.toThrow('Join the call first');
    chrome.runtime.sendMessage.mockResolvedValueOnce(undefined);
    await expect(askWorker({ type: 'capture/consent' })).rejects.toThrow('did not answer');
  });
});

describe('createExtensionLogger', () => {
  it('reports as the extension app with no user attached', async () => {
    const send = vi.fn(() => Promise.resolve(true));
    const logger = createExtensionLogger('popup', send);
    logger.error('Something broke', new Error('boom'));
    await logger.flush();
    expect(send).toHaveBeenCalledWith(
      expect.objectContaining({
        app: LOG_APP,
        source: 'PORTAL',
        user: null,
        platform: 'chrome-extension',
        appVersion: '1.0.0',
      }),
    );
    const batch = send.mock.calls[0] as unknown as [{ entries: Array<{ route: string }> }];
    expect(batch[0].entries[0].route).toBe('popup');
  });
});

describe('logTo', () => {
  it('reports a caught failure at the chosen level', () => {
    const logger = { warn: vi.fn(), error: vi.fn() };
    const failure = new Error('x');
    logTo(logger, 'Could not save')(failure);
    logTo(logger, 'Broke', 'error')(failure);
    expect(logger.warn).toHaveBeenCalledWith('Could not save', failure);
    expect(logger.error).toHaveBeenCalledWith('Broke', failure);
  });
});

describe('meet API', () => {
  function fake(data: Record<string, unknown>) {
    const request = vi.fn(() => Promise.resolve(data));
    const client = { request } as unknown as GraphqlClient;
    return { api: createMeetApi(client), request };
  }

  it('unwraps each root field', async () => {
    const value = { id: 'x' };
    const cases: Array<[string, (api: ReturnType<typeof createMeetApi>) => Promise<unknown>]> = [
      ['maExtensionContext', (api) => api.extensionContext()],
      [
        'maStartSession',
        (api) =>
          api.startSession({
            meetingCode: 'c',
            url: 'u',
            title: 't',
            timezone: 'UTC',
            startedAt: 'now',
          }),
      ],
      ['maRecordConsent', (api) => api.recordConsent('m')],
      [
        'maHeartbeat',
        (api) =>
          api.heartbeat('m', {
            transcriptionState: 'ON',
            captureState: 'IDLE',
            participantCount: 1,
            title: null,
          }),
      ],
      ['maRecordParticipantEvents', (api) => api.recordParticipantEvents('m', [])],
      ['maFinalizeSession', (api) => api.finalize('m', 'now')],
      ['maFollowUp', (api) => api.followUp('m')],
      ['maTranscript', (api) => api.transcript('m', null)],
      ['maParticipants', (api) => api.participants('m')],
      ['maActionItemsPaged', (api) => api.actions('m', 2)],
      ['maSetActionStatus', (api) => api.setActionStatus('a', 'COMPLETED')],
      ['maLatestRelease', (api) => api.latestRelease()],
      [
        'reportClientLogs',
        (api) =>
          api.reportLogs({
            source: 'PORTAL',
            app: 'a',
            entries: [],
            appVersion: null,
            platform: null,
            osVersion: null,
            deviceModel: null,
            deviceId: null,
            sessionId: null,
            user: null,
          }),
      ],
    ];
    const results = await Promise.all(
      cases.map(([field, call]) => call(fake({ [field]: value }).api)),
    );
    expect(results).toEqual(cases.map(() => value));
  });

  it('returns the whole notes answer and pages action items', async () => {
    const notes = { maMeeting: {}, maNotes: null, maDecisions: [] };
    await expect(fake(notes).api.notes('m')).resolves.toBe(notes);
    const { api, request } = fake({ maActionItemsPaged: {} });
    await api.actions('m', 3);
    expect(request.mock.calls[0]).toContainEqual(
      expect.objectContaining({
        meetingId: 'm',
        input: expect.objectContaining({ page: 3, pageSize: ACTIONS_PAGE_SIZE }),
      }),
    );
  });

  it('turns a locale bundle into messages, sent anonymously if needed', async () => {
    const { api, request } = fake({
      localeBundle: { locale: 'hi', translations: [{ source: 'Save', text: 'सहेजें' }] },
    });
    await expect(api.localeMessages('hi')).resolves.toEqual({ Save: 'सहेजें' });
    expect(request.mock.calls[0]).toContainEqual({ allowAnonymous: true });
  });
});
