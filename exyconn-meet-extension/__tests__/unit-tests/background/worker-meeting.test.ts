import { afterEach, describe, expect, it, vi } from 'vitest';
import { ORG } from '../fake-portal';
import { CODE, EXT, TAB, hello, joinCall, report, startWorker } from './harness';

afterEach(() => {
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

describe('service worker: startup and routing', () => {
  it('locks both token areas away from content scripts', async () => {
    const { chrome } = await startWorker();
    expect(chrome.storage.session.setAccessLevel).toHaveBeenCalledWith({
      accessLevel: 'TRUSTED_CONTEXTS',
    });
    expect(chrome.storage.local.setAccessLevel).toHaveBeenCalledWith({
      accessLevel: 'TRUSTED_CONTEXTS',
    });
  });

  it('reports a signed-out state with no tab', async () => {
    const worker = await startWorker({ signedIn: false });
    await expect(worker.send({ type: 'state/get' })).resolves.toEqual({
      ok: true,
      data: { auth: { signedIn: false, org: null }, tab: null },
    });
    await expect(worker.send({ type: 'state/get', tabId: 99 })).resolves.toMatchObject({
      data: { tab: null },
    });
  });

  it('ignores other extensions, broadcasts and offscreen commands', async () => {
    const worker = await startWorker();
    await expect(
      worker.send({ type: 'state/get' }, { id: 'someone-else' }),
    ).resolves.toBeUndefined();
    await expect(worker.send({ type: 'state/changed' })).resolves.toBeUndefined();
    await expect(
      worker.send({ target: 'offscreen', type: 'offscreen/stop' }),
    ).resolves.toBeUndefined();
    await expect(worker.send('not an object')).resolves.toBeUndefined();
  });

  it('refuses recorder reports that do not come from the offscreen page', async () => {
    const worker = await startWorker();
    await expect(
      worker.fromTab({ type: 'offscreen/notice', sessionKey: 'k', reason: 'stopped' }),
    ).resolves.toEqual({
      ok: false,
      error: 'Refused: not from the recorder',
    });
  });

  it('needs a tab for tab requests', async () => {
    const worker = await startWorker();
    await expect(worker.send({ type: 'capture/stop' })).resolves.toEqual({
      ok: false,
      error: 'Open a Google Meet call first',
    });
  });

  it('relays logs, serves translations and opens the options page', async () => {
    const worker = await startWorker();
    const batch = {
      source: 'PORTAL',
      app: 'x',
      entries: [],
      appVersion: null,
      platform: null,
      osVersion: null,
      deviceModel: null,
      deviceId: null,
      sessionId: null,
      user: null,
    };
    await expect(worker.send({ type: 'log/batch', batch })).resolves.toEqual({
      ok: true,
      data: true,
    });
    await expect(worker.send({ type: 'i18n/messages' })).resolves.toEqual({
      ok: true,
      data: { 'Remind later': 'Later' },
    });
    await worker.send({ type: 'i18n/messages' });
    expect(worker.portal.ops('LocaleBundle')).toHaveLength(1);
    await worker.send({ type: 'options/open' });
    expect(worker.chrome.runtime.openOptionsPage).toHaveBeenCalledTimes(1);
  });

  it('falls back to English when translations cannot load', async () => {
    const worker = await startWorker();
    worker.portal.graphql.LocaleBundle = () => {
      throw new Error('down');
    };
    await expect(worker.send({ type: 'i18n/messages' })).resolves.toEqual({ ok: true, data: {} });
  });

  it('answers unknown request types with nothing', async () => {
    const worker = await startWorker();
    await expect(worker.fromTab({ type: 'nope' } as never)).resolves.toEqual({
      ok: true,
      data: null,
    });
  });
});

describe('service worker: a call', () => {
  it('opens one server session once the user is in the call, and publishes the state', async () => {
    const worker = await startWorker();
    await worker.fromTab(hello());
    await worker.fromTab(report({ meetingState: 'WAITING' }));
    expect(worker.portal.ops('MaStartSession')).toHaveLength(0);
    await worker.fromTab(report());
    await worker.fromTab(report({ title: 'Renamed' }));
    expect(worker.portal.ops('MaStartSession')).toHaveLength(1);
    expect(worker.portal.ops('MaStartSession')[0].variables.input).toMatchObject({
      meetingCode: CODE,
      url: `https://meet.google.com/${CODE}`,
    });
    expect(await worker.session()).toMatchObject({
      meetingId: 'm1',
      meetingState: 'IN_MEETING',
      consentRecorded: false,
    });
    expect(worker.chrome.alarms.store.has('heartbeat')).toBe(true);
    expect(worker.chrome.tabs.sendMessage).toHaveBeenCalledWith(
      TAB,
      expect.objectContaining({ type: 'state/changed' }),
    );
    expect(worker.chrome.action.setBadgeText).toHaveBeenCalled();
    const state = await worker.fromTab({ type: 'state/get' });
    expect(state).toMatchObject({
      data: { auth: { signedIn: true, org: ORG }, tab: { meetingId: 'm1', iconStatus: 'IDLE' } },
    });
  });

  it('ignores reports for another call than the tab announced', async () => {
    const worker = await startWorker();
    await worker.fromTab(hello());
    await worker.fromTab(report({ meetingCode: 'zzz-zzzz-zzz' }));
    expect(worker.portal.ops('MaStartSession')).toHaveLength(0);
  });

  it('does not open a session when the company turned the assistant off, or when signed out', async () => {
    const worker = await startWorker();
    worker.portal.graphql.MaExtensionContext = () => ({
      maExtensionContext: { ...ORG, enabled: false },
    });
    await joinCall(worker);
    expect(worker.portal.ops('MaStartSession')).toHaveLength(0);
    const signedOut = await startWorker({ signedIn: false });
    await joinCall(signedOut);
    expect(signedOut.portal.ops('MaStartSession')).toHaveLength(0);
  });

  it('logs and carries on when the session cannot be opened', async () => {
    const worker = await startWorker();
    worker.portal.graphql.MaStartSession = () => {
      throw new Error('boom');
    };
    await joinCall(worker);
    expect((await worker.session())?.meetingId).toBeNull();
  });

  it('sends participant changes in batches, only with tracking on', async () => {
    const worker = await startWorker();
    await joinCall(worker);
    const people = Array.from({ length: 55 }, (_, i) => ({
      key: `p${i}`,
      displayName: `P${i}`,
      isSelf: i === 0,
    }));
    await worker.fromTab(report({ participants: people, participantsComplete: true }));
    const batches = worker.portal
      .ops('MaRecordParticipantEvents')
      .map((call) => (call.variables.events as unknown[]).length);
    expect(batches).toEqual([50, 5]);
    expect((await worker.session())?.pendingEvents).toEqual([]);
  });

  it('keeps unsent participant changes when the portal fails, and drops them when tracking is off', async () => {
    const worker = await startWorker();
    await joinCall(worker);
    worker.portal.graphql.MaRecordParticipantEvents = () => {
      throw new Error('down');
    };
    await worker.fromTab(
      report({ participants: [{ key: 'ravi', displayName: 'Ravi', isSelf: false }] }),
    );
    expect((await worker.session())?.pendingEvents).toHaveLength(1);
    worker.portal.graphql.MaExtensionContext = () => ({
      maExtensionContext: { ...ORG, participantTracking: false },
    });
    await worker.chrome.storage.session.remove('org');
    await worker.fromTab(report({ participants: [], title: 'x' }));
    expect((await worker.session())?.pendingEvents).toEqual([]);
  });

  it('keeps the meeting across a reload of the same call and stops a running capture', async () => {
    const worker = await startWorker();
    await joinCall(worker);
    const before = await worker.session();
    await worker.fromTab(hello());
    const after = await worker.session();
    expect(after).toMatchObject({ meetingId: 'm1', meetingState: 'PAGE_OPENED' });
    expect(after?.sessionKey).not.toBe(before?.sessionKey);
  });

  it('closes the previous call when the tab moves to another one', async () => {
    const worker = await startWorker();
    await joinCall(worker);
    await worker.fromTab(hello('zzz-zzzz-zzz'));
    expect(worker.portal.ops('MaFinalizeSession')).toHaveLength(1);
    expect(await worker.session()).toMatchObject({ meetingCode: 'zzz-zzzz-zzz', meetingId: null });
  });

  it('finalizes when the call ends', async () => {
    const worker = await startWorker();
    await joinCall(worker);
    await worker.fromTab(report({ meetingState: 'ENDED' }));
    expect(worker.portal.ops('MaFinalizeSession')).toHaveLength(1);
    expect(await worker.session()).toMatchObject({ meetingState: 'ENDED', finalizePending: false });
  });

  it('retries finalize on the safety alarm when the portal failed', async () => {
    const worker = await startWorker();
    await joinCall(worker);
    worker.portal.graphql.MaFinalizeSession = () => {
      throw new Error('down');
    };
    await worker.fromTab(report({ meetingState: 'ENDED' }));
    expect((await worker.session())?.finalizePending).toBe(true);
    expect(worker.chrome.alarms.store.has(`finalize:${TAB}`)).toBe(true);
    worker.portal.graphql.MaFinalizeSession = () => ({
      maFinalizeSession: { id: 'm1', status: 'ENDED' },
    });
    worker.alarm(`finalize:${TAB}`);
    await vi.waitFor(async () => expect((await worker.session())?.finalizePending).toBe(false));
  });

  it('waits out a vanished page, then finalizes; a quick reload cancels that', async () => {
    const worker = await startWorker();
    await joinCall(worker);
    await worker.fromTab({ type: 'meet/gone' });
    expect((await worker.session())?.meetingState).toBe('DISCONNECTED');
    expect(worker.chrome.alarms.store.has(`finalize:${TAB}`)).toBe(true);
    worker.alarm(`finalize:${TAB}`);
    await vi.waitFor(() => expect(worker.portal.ops('MaFinalizeSession')).toHaveLength(1));
    await worker.fromTab(hello());
    expect(worker.chrome.alarms.store.has(`finalize:${TAB}`)).toBe(false);
  });

  it('ignores a finalize alarm or page-gone for an unknown tab', async () => {
    const worker = await startWorker();
    worker.alarm('finalize:42');
    await worker.fromTab({ type: 'meet/gone' }, 42);
    expect(worker.chrome.alarms.store.has('finalize:42')).toBe(false);
  });

  it('finalizes and forgets a closed tab', async () => {
    const worker = await startWorker();
    await joinCall(worker);
    worker.chrome.tabs.onRemoved.emit(TAB);
    await vi.waitFor(async () => expect(await worker.session()).toBeUndefined());
    expect(worker.portal.ops('MaFinalizeSession')).toHaveLength(1);
  });

  it('forgets a closed tab that never reached the call, and ignores unknown tabs', async () => {
    const worker = await startWorker();
    await worker.fromTab(hello());
    worker.chrome.tabs.onRemoved.emit(TAB);
    worker.chrome.tabs.onRemoved.emit(77);
    await vi.waitFor(async () => expect(await worker.session()).toBeUndefined());
    expect(worker.portal.ops('MaFinalizeSession')).toHaveLength(0);
  });

  it('sends heartbeats every minute and clears the alarm when no call is live', async () => {
    const worker = await startWorker();
    await joinCall(worker);
    await worker.fromTab(hello(), 6);
    worker.alarm('heartbeat');
    await vi.waitFor(() => expect(worker.portal.ops('MaHeartbeat')).toHaveLength(1));
    expect(worker.portal.ops('MaHeartbeat')[0].variables).toMatchObject({
      meetingId: 'm1',
      input: { transcriptionState: 'ON', captureState: 'IDLE', participantCount: 0 },
    });
    worker.portal.graphql.MaHeartbeat = () => {
      throw new Error('down');
    };
    worker.alarm('heartbeat');
    await vi.waitFor(() => expect(worker.portal.ops('MaHeartbeat')).toHaveLength(2));
    await worker.fromTab(report({ meetingState: 'ENDED' }));
    worker.alarm('heartbeat');
    await vi.waitFor(() => expect(worker.chrome.alarms.store.has('heartbeat')).toBe(false));
  });

  it('ignores alarms it does not own', async () => {
    const worker = await startWorker();
    worker.alarm('something-else');
    worker.alarm('reminder:abc');
    expect(worker.chrome.notifications.create).not.toHaveBeenCalled();
  });

  it('a content script can only speak for its own tab', async () => {
    const worker = await startWorker();
    await joinCall(worker);
    const reply = await worker.send(
      { type: 'state/get', tabId: TAB },
      { id: EXT, tab: { id: 8 } as chrome.tabs.Tab },
    );
    expect(reply).toMatchObject({ data: { tab: null } });
  });
});
