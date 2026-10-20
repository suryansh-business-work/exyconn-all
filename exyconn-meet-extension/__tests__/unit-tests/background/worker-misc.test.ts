import { afterEach, describe, expect, it, vi } from 'vitest';
import { jsonResponse } from '../chrome-mock';
import { ORG } from '../fake-portal';
import { TAB, joinCall, report, startWorker } from './harness';

afterEach(() => vi.unstubAllGlobals());

describe('service worker: reminders', () => {
  it('reminds with a banner and a notification when Meet transcription is off', async () => {
    const worker = await startWorker();
    await joinCall(worker, TAB, { transcriptionState: 'OFF' });
    expect(worker.chrome.notifications.create).toHaveBeenCalledWith(
      `reminder:${TAB}`,
      expect.objectContaining({
        message:
          'Meeting transcription is off. Enable transcription to generate meeting notes and action items.',
        buttons: [{ title: 'Later' }, { title: 'Snooze' }],
      }),
    );
    expect((await worker.session())?.reminder).toMatchObject({ shown: 1, bannerVisible: true });
    expect(worker.chrome.alarms.store.has(`reminder:${TAB}`)).toBe(true);
  });

  it('shows only the banner when desktop notifications are off', async () => {
    const worker = await startWorker();
    await worker.chrome.storage.sync.set({ prefs: { desktopNotifications: false } });
    await joinCall(worker, TAB, { transcriptionState: 'OFF' });
    expect(worker.chrome.notifications.create).not.toHaveBeenCalled();
    expect((await worker.session())?.reminder.bannerVisible).toBe(true);
  });

  it('never reminds when the company turned reminders off or the user is signed out', async () => {
    const worker = await startWorker();
    worker.portal.graphql.MaExtensionContext = () => ({
      maExtensionContext: { ...ORG, remindersEnabled: false },
    });
    await joinCall(worker, TAB, { transcriptionState: 'OFF' });
    expect(worker.chrome.notifications.create).not.toHaveBeenCalled();
    const signedOut = await startWorker({ signedIn: false });
    await joinCall(signedOut, TAB, { transcriptionState: 'OFF' });
    expect(signedOut.chrome.notifications.create).not.toHaveBeenCalled();
  });

  it('handles the notification buttons and the in-page choices', async () => {
    const worker = await startWorker();
    await joinCall(worker, TAB, { transcriptionState: 'OFF' });
    worker.chrome.notifications.onButtonClicked.emit(`reminder:${TAB}`, 0);
    await vi.waitFor(async () =>
      expect((await worker.session())?.reminder.bannerVisible).toBe(false),
    );
    worker.chrome.notifications.onButtonClicked.emit(`reminder:${TAB}`, 1);
    await vi.waitFor(async () =>
      expect((await worker.session())?.reminder.snoozedUntil).not.toBeNull(),
    );
    worker.chrome.notifications.onButtonClicked.emit('other', 0);
    await worker.fromTab({ type: 'reminder/action', action: 'DISMISS' });
    expect((await worker.session())?.reminder).toMatchObject({ dismissed: true, nextAt: null });
    expect(worker.chrome.alarms.store.has(`reminder:${TAB}`)).toBe(false);
    await worker.send({ type: 'reminder/action', tabId: 99, action: 'LATER' });
  });

  it('shows the next reminder when its alarm fires and stops when transcription comes on', async () => {
    const worker = await startWorker();
    await joinCall(worker, TAB, { transcriptionState: 'OFF' });
    const stored = await worker.chrome.storage.session.get('sessions');
    const sessions = stored.sessions as Record<string, { reminder: { nextAt: number } }>;
    sessions[TAB].reminder.nextAt = Date.now() - 1;
    await worker.chrome.storage.session.set({ sessions });
    worker.alarm(`reminder:${TAB}`);
    await vi.waitFor(async () => expect((await worker.session())?.reminder.shown).toBe(2));
    await worker.fromTab(report({ transcriptionState: 'ON' }));
    expect(worker.chrome.notifications.clear).toHaveBeenCalledWith(`reminder:${TAB}`);
    worker.alarm('reminder:404');
  });

  it('brings the call to the front when the notification is clicked', async () => {
    const worker = await startWorker();
    worker.chrome.notifications.onClicked.emit(`reminder:${TAB}`);
    await vi.waitFor(() =>
      expect(worker.chrome.windows.update).toHaveBeenCalledWith(3, { focused: true }),
    );
    expect(worker.chrome.tabs.update).toHaveBeenCalledWith(TAB, { active: true });
    worker.chrome.tabs.update.mockResolvedValueOnce(undefined);
    worker.chrome.notifications.onClicked.emit(`reminder:${TAB}`);
    worker.chrome.notifications.onClicked.emit('elsewhere');
    await vi.waitFor(() => expect(worker.chrome.notifications.clear).toHaveBeenCalledTimes(2));
  });
});

describe('service worker: sign-in', () => {
  it('signs in through the portal with PKCE and loads the company context', async () => {
    const worker = await startWorker({ signedIn: false });
    worker.chrome.identity.launchWebAuthFlow.mockImplementation(({ url }) => {
      const state = new URL(url).searchParams.get('state');
      return Promise.resolve(
        `https://test-extension-id.chromiumapp.org/auth?code=abc&state=${state}`,
      );
    });
    await joinCall(worker);
    await expect(worker.send({ type: 'auth/sign-in' })).resolves.toEqual({ ok: true, data: null });
    const url = new URL(worker.chrome.identity.launchWebAuthFlow.mock.calls[0][0].url);
    expect(url.pathname).toBe('/me/meetings/connect-extension');
    expect(url.searchParams.get('code_challenge_method')).toBe('S256');
    const exchange = JSON.parse(
      String(worker.portal.fetchMock.mock.calls.find(([u]) => u.endsWith('/auth/token'))?.[1].body),
    );
    expect(exchange).toMatchObject({
      grant_type: 'authorization_code',
      code: 'abc',
      device_label: 'Chrome on mac',
    });
    await expect(worker.send({ type: 'state/get' })).resolves.toMatchObject({
      data: { auth: { signedIn: true, org: ORG } },
    });
  });

  it('reports a cancelled sign-in', async () => {
    const worker = await startWorker({ signedIn: false });
    worker.chrome.identity.launchWebAuthFlow.mockResolvedValue(undefined);
    await expect(worker.send({ type: 'auth/sign-in' })).resolves.toEqual({
      ok: false,
      error: 'Sign-in was cancelled',
    });
  });

  it('signs out: revokes, forgets the sign-in and the company context', async () => {
    const worker = await startWorker();
    await joinCall(worker);
    await expect(worker.send({ type: 'auth/sign-out' })).resolves.toEqual({ ok: true, data: null });
    expect(worker.portal.fetchMock.mock.calls.some(([u]) => u.endsWith('/auth/revoke'))).toBe(true);
    expect(worker.chrome.storage.local.data.has('auth.refresh')).toBe(false);
    await expect(worker.send({ type: 'state/get' })).resolves.toMatchObject({
      data: { auth: { signedIn: false, org: null } },
    });
  });

  it('warns but still signs out when the revoke fails', async () => {
    const worker = await startWorker();
    worker.portal.fetchMock.mockImplementationOnce(() => Promise.resolve(jsonResponse(500, {})));
    await expect(worker.send({ type: 'auth/sign-out' })).resolves.toEqual({ ok: true, data: null });
    expect(worker.chrome.storage.local.data.has('auth.refresh')).toBe(false);
  });

  it('forgets the company context when the portal rejects the sign-in for good', async () => {
    const worker = await startWorker();
    await worker.send({ type: 'state/get' });
    expect(worker.chrome.storage.session.data.has('org')).toBe(true);
    worker.portal.tokenReplies.push(jsonResponse(400, { error: 'invalid_grant' }));
    worker.portal.graphql.MaFollowUp = () => {
      throw new Error('ignored');
    };
    worker.portal.fetchMock.mockImplementationOnce(() => Promise.resolve(jsonResponse(401, {})));
    await joinCall(worker);
    await vi.waitFor(() => expect(worker.chrome.storage.session.data.has('org')).toBe(false));
  });

  it('keeps the cached company context when the portal is unreachable, and refetches it when stale', async () => {
    const worker = await startWorker();
    await worker.send({ type: 'state/get' });
    worker.portal.graphql.MaExtensionContext = () => {
      throw new Error('down');
    };
    await worker.chrome.storage.session.set({ org: { org: ORG, fetchedAt: 0 } });
    await expect(worker.send({ type: 'state/get' })).resolves.toMatchObject({
      data: { auth: { org: ORG } },
    });
    await worker.chrome.storage.session.remove('org');
    await expect(worker.send({ type: 'state/get' })).resolves.toMatchObject({
      data: { auth: { signedIn: true, org: null } },
    });
  });
});

describe('service worker: panel', () => {
  it("answers each panel request for the tab's own meeting", async () => {
    const worker = await startWorker();
    await expect(
      worker.fromTab({ type: 'panel/request', request: { op: 'followUp' } }),
    ).resolves.toEqual({ ok: false, error: 'The meeting has not started yet' });
    await joinCall(worker);
    const ask = (request: object) => worker.fromTab({ type: 'panel/request', request } as never);
    await expect(ask({ op: 'followUp' })).resolves.toMatchObject({
      ok: true,
      data: { pendingActions: [] },
    });
    await expect(ask({ op: 'transcript', afterMs: null })).resolves.toEqual({
      ok: true,
      data: [{ id: 't1', startMs: 0, endMs: 900, text: 'Hello', speakerLabel: 'A' }],
    });
    await expect(ask({ op: 'participants' })).resolves.toEqual({ ok: true, data: [] });
    await expect(ask({ op: 'notes' })).resolves.toMatchObject({
      ok: true,
      data: { maNotes: null },
    });
    await expect(ask({ op: 'actions', page: 1 })).resolves.toEqual({
      ok: true,
      data: { rows: [], totalCount: 0 },
    });
    await expect(ask({ op: 'setActionStatus', id: 'a1', status: 'COMPLETED' })).resolves.toEqual({
      ok: true,
      data: { id: 'a1', status: 'COMPLETED' },
    });
    expect(worker.portal.ops('MaFollowUp')[0].variables).toEqual({ meetingId: 'm1' });
  });

  it('prefers a confirmed speaker name in the transcript', async () => {
    const worker = await startWorker();
    worker.portal.graphql.MaTranscript = () => ({
      maTranscript: [
        { id: 't1', startMs: 0, endMs: 1, text: 'x', speakerLabel: 'A', speakerName: 'Ravi' },
      ],
    });
    await joinCall(worker);
    await expect(
      worker.fromTab({ type: 'panel/request', request: { op: 'transcript', afterMs: 0 } }),
    ).resolves.toMatchObject({ data: [{ speakerLabel: 'Ravi' }] });
  });

  it('refuses the live transcript when the user or the company turned it off', async () => {
    const worker = await startWorker();
    await joinCall(worker);
    await worker.chrome.storage.sync.set({ prefs: { liveTranscript: false } });
    await expect(
      worker.fromTab({ type: 'panel/request', request: { op: 'transcript', afterMs: null } }),
    ).resolves.toEqual({ ok: false, error: 'Live transcript is turned off' });
  });
});
