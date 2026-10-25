import { afterEach, describe, expect, it, vi } from 'vitest';
import { ORG } from '../fake-portal';
import { TAB, consent, ended, hello, joinCall, report, startCapture, startWorker } from './harness';

afterEach(() => vi.unstubAllGlobals());

const STARTED_AT_MS = Date.parse('2026-10-20T10:00:00.000Z');

describe('service worker: starting capture', () => {
  it('answers the plan the recorder follows once consent is on record', async () => {
    const worker = await startWorker();
    await consent(worker);
    expect(worker.portal.ops('MaRecordConsent')).toHaveLength(1);
    await expect(worker.fromTab({ type: 'recorder/prepare' })).resolves.toEqual({
      ok: true,
      data: {
        meetingId: 'm1',
        meetingStartedAtMs: STARTED_AT_MS,
        captureMic: false,
        chunkMs: 15_000,
        pieceMs: 5000,
        saveVideo: false,
        videoPart: 0,
      },
    });
    expect((await worker.session())?.captureState).toBe('IDLE');
  });

  it('asks for the screen recording and the microphone when the company and the user want them', async () => {
    const worker = await startWorker();
    worker.portal.graphql.MaExtensionContext = () => ({
      maExtensionContext: { ...ORG, saveRecordings: true },
    });
    await worker.chrome.storage.sync.set({ prefs: { captureMicrophone: true } });
    await consent(worker);
    await expect(worker.fromTab({ type: 'recorder/prepare' })).resolves.toMatchObject({
      data: { captureMic: true, saveVideo: true },
    });
  });

  it('marks the tab as recording, numbers the next part and keeps the worker alive', async () => {
    const worker = await startWorker();
    await startCapture(worker, TAB, true);
    expect(await worker.session()).toMatchObject({
      captureState: 'RECORDING',
      recorderActive: true,
      micEnabled: true,
      captureError: null,
      videoPart: 1,
    });
    expect(worker.chrome.alarms.store.get('heartbeat')).toMatchObject({ periodInMinutes: 1 });
    expect(worker.chrome.action.setBadgeText).toHaveBeenLastCalledWith({ tabId: TAB, text: 'REC' });
    const startedAt = (await worker.session())?.captureStartedAt;
    await worker.fromTab({ type: 'capture/stop' });
    await worker.fromTab(ended());
    await expect(worker.fromTab({ type: 'recorder/prepare' })).resolves.toMatchObject({
      data: { videoPart: 1 },
    });
    await worker.fromTab({ type: 'recorder/started', micEnabled: false });
    expect(await worker.session()).toMatchObject({
      videoPart: 2,
      micEnabled: false,
      captureStartedAt: startedAt,
    });
  });

  it('never starts before the call, without consent, twice, or in a second tab of the call', async () => {
    const worker = await startWorker();
    await worker.fromTab(hello());
    await expect(worker.fromTab({ type: 'capture/consent' })).resolves.toEqual({
      ok: false,
      error: 'Join the call before starting transcription',
    });
    await expect(worker.fromTab({ type: 'recorder/prepare' })).resolves.toEqual({
      ok: false,
      error: 'Join the call before starting transcription',
    });
    await joinCall(worker);
    await expect(worker.fromTab({ type: 'recorder/prepare' })).resolves.toMatchObject({
      ok: false,
      error: expect.stringMatching(/Confirm/),
    });
    await startCapture(worker);
    await expect(worker.fromTab({ type: 'recorder/prepare' })).resolves.toEqual({
      ok: false,
      error: 'Transcription is already running',
    });
    await consent(worker, 6);
    await expect(worker.fromTab({ type: 'recorder/prepare' }, 6)).resolves.toMatchObject({
      ok: false,
      error: expect.stringMatching(/another tab/),
    });
    const state = await worker.send({ type: 'state/get', tabId: 6 });
    expect(state).toMatchObject({ data: { tab: { captureElsewhere: true } } });
  });

  it('refuses a start while signed out, before any page announced itself', async () => {
    const worker = await startWorker({ signedIn: false });
    await expect(worker.fromTab({ type: 'recorder/prepare' })).resolves.toEqual({
      ok: false,
      error: 'Sign in to Exyconn to transcribe meetings',
    });
  });
});

describe('service worker: commanding the recorder', () => {
  it('pauses, resumes and stops the recorder in the Meet page', async () => {
    const worker = await startWorker();
    await startCapture(worker);
    await worker.fromTab({ type: 'capture/pause' });
    await worker.fromTab({ type: 'capture/pause' });
    expect((await worker.session())?.captureState).toBe('PAUSED');
    await expect(worker.fromTab({ type: 'capture/resume' })).resolves.toEqual({
      ok: true,
      data: null,
    });
    expect((await worker.session())?.captureState).toBe('RECORDING');
    await expect(worker.fromTab({ type: 'capture/resume' })).resolves.toEqual({
      ok: false,
      error: 'Start transcription again from the assistant panel',
    });
    await worker.fromTab({ type: 'capture/stop' });
    await worker.fromTab({ type: 'capture/stop' });
    expect(await worker.session()).toMatchObject({ captureState: 'STOPPED', recorderActive: true });
    expect(worker.recorderCommands()).toEqual([
      'recorder/pause',
      'recorder/resume',
      'recorder/stop',
    ]);
  });

  it("shows the recorder's refusal of a command", async () => {
    const worker = await startWorker();
    await startCapture(worker);
    worker.chrome.tabs.sendMessage.mockResolvedValueOnce({
      ok: false,
      error: 'The recorder did not respond. Try again.',
    });
    await expect(worker.fromTab({ type: 'capture/pause' })).resolves.toEqual({
      ok: false,
      error: 'The recorder did not respond. Try again.',
    });
    expect((await worker.session())?.captureState).toBe('RECORDING');
  });

  it('treats the recorder as ended when its page is gone', async () => {
    const worker = await startWorker();
    await startCapture(worker);
    await worker.fromTab({ type: 'capture/pause' });
    worker.chrome.tabs.goneTabs.add(TAB);
    await expect(worker.fromTab({ type: 'capture/resume' })).resolves.toEqual({
      ok: false,
      error: 'Start transcription again from the assistant panel',
    });
    await worker.fromTab({ type: 'capture/stop' });
    expect(await worker.session()).toMatchObject({
      captureState: 'STOPPED',
      recorderActive: false,
    });
    await expect(worker.fromTab({ type: 'capture/resume' })).resolves.toMatchObject({ ok: false });
  });

  it('stops a running capture when the page reloads', async () => {
    const worker = await startWorker();
    await startCapture(worker);
    await worker.fromTab(hello());
    expect(await worker.session()).toMatchObject({
      captureState: 'STOPPED',
      captureError: expect.stringMatching(/page reloaded/),
      meetingId: 'm1',
      consentRecorded: true,
      videoPart: 1,
    });
    expect(worker.recorderCommands()).toEqual(['recorder/stop']);
  });

  it('stops capture at the company maximum on the heartbeat', async () => {
    const worker = await startWorker();
    worker.portal.graphql.MaExtensionContext = () => ({
      maExtensionContext: { ...ORG, maxMeetingMinutes: 1 },
    });
    await startCapture(worker);
    const stored = await worker.chrome.storage.session.get('sessions');
    const sessions = stored.sessions as Record<string, { captureStartedAt: number }>;
    sessions[TAB].captureStartedAt = Date.now() - 2 * 60_000;
    await worker.chrome.storage.session.set({ sessions });
    worker.alarm('heartbeat');
    await vi.waitFor(async () => expect((await worker.session())?.captureState).toBe('STOPPED'));
    expect((await worker.session())?.captureError).toMatch(/maximum length/);
  });
});

describe('service worker: what the recorder reports', () => {
  it('keeps the state on a requested end and stops with the reason on its own end', async () => {
    const worker = await startWorker();
    await startCapture(worker);
    await worker.fromTab(ended());
    expect(await worker.session()).toMatchObject({
      captureState: 'RECORDING',
      recorderActive: false,
      captureError: null,
    });
    await worker.fromTab({ type: 'recorder/started', micEnabled: false });
    await worker.fromTab(ended('Sharing this tab stopped, so transcription stopped'));
    expect(await worker.session()).toMatchObject({
      captureState: 'STOPPED',
      recorderActive: false,
      captureError: 'Sharing this tab stopped, so transcription stopped',
    });
    await expect(worker.fromTab(ended(), 404)).resolves.toEqual({ ok: true, data: null });
  });

  it('shows a notice while recording goes on', async () => {
    const worker = await startWorker();
    await startCapture(worker);
    await worker.fromTab({ type: 'recorder/notice', reason: 'The microphone is not available' });
    expect(await worker.session()).toMatchObject({
      captureState: 'RECORDING',
      captureError: 'The microphone is not available',
    });
  });

  it('finalizes an ended call only once the recorder has flushed', async () => {
    const worker = await startWorker();
    await startCapture(worker);
    await worker.fromTab(report({ meetingState: 'ENDED' }));
    expect(worker.recorderCommands()).toEqual(['recorder/stop']);
    expect(worker.portal.ops('MaFinalizeSession')).toHaveLength(0);
    await worker.fromTab(ended());
    expect(worker.portal.ops('MaFinalizeSession')).toHaveLength(1);
    expect(await worker.session()).toMatchObject({ finalizePending: false, recorderActive: false });
  });

  it('finalizes at once when the page of an ended call is already gone', async () => {
    const worker = await startWorker();
    await startCapture(worker);
    worker.chrome.tabs.goneTabs.add(TAB);
    await worker.fromTab(report({ meetingState: 'ENDED' }));
    expect(worker.portal.ops('MaFinalizeSession')).toHaveLength(1);
  });
});
