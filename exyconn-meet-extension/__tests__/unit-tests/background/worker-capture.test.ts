import { afterEach, describe, expect, it, vi } from 'vitest';
import { jsonResponse } from '../chrome-mock';
import { ORG } from '../fake-portal';
import { TAB, chunk, joinCall, report, startCapture, startWorker, type Worker } from './harness';

afterEach(() => vi.unstubAllGlobals());

/** The commands the worker sent to the offscreen recorder. */
function offscreenCommands(worker: Worker): Array<Record<string, unknown>> {
  return worker.chrome.runtime.sendMessage.mock.calls
    .map(([message]) => message as Record<string, unknown>)
    .filter((message) => message.target === 'offscreen');
}

describe('service worker: capture', () => {
  it('records consent, then starts the recorder in an offscreen document', async () => {
    const worker = await startWorker();
    await expect(startCapture(worker)).resolves.toEqual({ ok: true, data: null });
    expect(worker.portal.ops('MaRecordConsent')).toHaveLength(1);
    expect(worker.chrome.tabCapture.getMediaStreamId).toHaveBeenCalledWith({ targetTabId: TAB });
    expect(worker.chrome.offscreen.createDocument).toHaveBeenCalledWith(
      expect.objectContaining({ url: 'offscreen.html', reasons: ['USER_MEDIA'] }),
    );
    expect(offscreenCommands(worker)).toEqual([
      expect.objectContaining({
        type: 'offscreen/start',
        tabId: TAB,
        meetingId: 'm1',
        streamId: 'stream-1',
        captureMic: false,
        chunkMs: 25_000,
      }),
    ]);
    expect(await worker.session()).toMatchObject({
      captureState: 'RECORDING',
      recorderActive: true,
    });
    expect(worker.chrome.action.setBadgeText).toHaveBeenLastCalledWith({ tabId: TAB, text: 'REC' });
  });

  it('reuses an open offscreen document', async () => {
    const worker = await startWorker();
    worker.chrome.runtime.getContexts.mockResolvedValue([{}]);
    await startCapture(worker);
    expect(worker.chrome.offscreen.createDocument).not.toHaveBeenCalled();
  });

  it('never starts without consent, before the call, or in a second tab of the call', async () => {
    const worker = await startWorker();
    await expect(worker.send({ type: 'capture/consent', tabId: TAB })).resolves.toEqual({
      ok: false,
      error: 'Join the call before starting transcription',
    });
    await expect(worker.send({ type: 'capture/start', tabId: TAB })).resolves.toEqual({
      ok: false,
      error: 'Join the call before starting transcription',
    });
    await joinCall(worker);
    await expect(worker.send({ type: 'capture/start', tabId: TAB })).resolves.toMatchObject({
      ok: false,
      error: expect.stringMatching(/Confirm/),
    });
    await worker.send({ type: 'capture/consent', tabId: TAB });
    await worker.send({ type: 'capture/start', tabId: TAB });
    await joinCall(worker, 6);
    await worker.send({ type: 'capture/consent', tabId: 6 });
    await expect(worker.send({ type: 'capture/start', tabId: 6 })).resolves.toMatchObject({
      ok: false,
      error: expect.stringMatching(/another tab/),
    });
    const state = await worker.send({ type: 'state/get', tabId: 6 });
    expect(state).toMatchObject({ data: { tab: { captureElsewhere: true } } });
  });

  it('explains that capture must start from the toolbar when Chrome refuses the tab', async () => {
    const worker = await startWorker();
    worker.chrome.tabCapture.getMediaStreamId.mockRejectedValue(new Error('not invoked'));
    await expect(startCapture(worker)).resolves.toMatchObject({
      ok: false,
      error: expect.stringMatching(/toolbar button/),
    });
  });

  it('shows an error when the recorder cannot start', async () => {
    const worker = await startWorker();
    worker.chrome.runtime.sendMessage.mockImplementation((message: unknown) =>
      Promise.resolve(
        (message as { target?: string }).target === 'offscreen'
          ? { ok: false, error: 'The recorder could not start.' }
          : undefined,
      ),
    );
    await expect(startCapture(worker)).resolves.toEqual({
      ok: false,
      error: 'The recorder could not start.',
    });
    expect(await worker.session()).toMatchObject({ captureState: 'ERROR', recorderActive: false });
  });

  it('uploads chunks in order with per-meeting sequence numbers and keeps the lines for the panel', async () => {
    const worker = await startWorker();
    await startCapture(worker);
    worker.portal.audioReplies.push(
      jsonResponse(200, {
        status: 'DONE',
        segments: [{ id: 's1', startMs: 0, endMs: 900, text: 'Hi', speakerLabel: null }],
      }),
    );
    await worker.fromOffscreen(chunk(0));
    await worker.fromOffscreen(chunk(1));
    await vi.waitFor(() => expect(worker.portal.audio).toHaveLength(2));
    expect(worker.portal.audio.map((body) => body.seq)).toEqual([0, 1]);
    await vi.waitFor(async () => expect((await worker.session())?.pendingUploads).toBe(0));
    await expect(
      worker.fromTab({ type: 'panel/request', request: { op: 'liveSegments' } }),
    ).resolves.toEqual({
      ok: true,
      data: [{ id: 's1', startMs: 0, endMs: 900, text: 'Hi', speakerLabel: null }],
    });
  });

  it('drops audio for a meeting without consent on record', async () => {
    const worker = await startWorker();
    await joinCall(worker);
    await worker.fromOffscreen(chunk(0));
    expect(worker.portal.audio).toHaveLength(0);
  });

  it('stops capture with a clear error when an upload can never succeed', async () => {
    const worker = await startWorker();
    await startCapture(worker);
    worker.portal.audioReplies.push(jsonResponse(403, { error: 'budget_exceeded' }));
    await worker.fromOffscreen(chunk(0));
    await vi.waitFor(async () => expect((await worker.session())?.captureState).toBe('ERROR'));
    expect((await worker.session())?.captureError).toMatch(/budget/);
    expect(offscreenCommands(worker).map((c) => c.type)).toContain('offscreen/stop');
  });

  it('pauses capture when uploads fall behind instead of dropping audio', async () => {
    const worker = await startWorker();
    await startCapture(worker);
    let release: (value: Response) => void = () => undefined;
    worker.portal.audioReplies.push(new Response());
    worker.portal.fetchMock.mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          release = resolve;
        }),
    );
    await Promise.all([0, 1, 2, 3, 4, 5, 6, 7].map((seq) => worker.fromOffscreen(chunk(seq))));
    expect(await worker.session()).toMatchObject({
      captureState: 'PAUSED',
      captureError: expect.stringMatching(/falling behind/),
    });
    await expect(worker.send({ type: 'capture/resume', tabId: TAB })).resolves.toMatchObject({
      ok: false,
      error: expect.stringMatching(/falling behind/),
    });
    await Promise.all([8, 9, 10, 11, 12].map((seq) => worker.fromOffscreen(chunk(seq))));
    release(jsonResponse(200, { status: 'DONE' }));
    await vi.waitFor(async () => expect((await worker.session())?.pendingUploads).toBe(0));
    await expect(worker.send({ type: 'capture/resume', tabId: TAB })).resolves.toEqual({
      ok: true,
      data: null,
    });
  });

  it('pauses, resumes and stops on request', async () => {
    const worker = await startWorker();
    await startCapture(worker);
    await worker.send({ type: 'capture/pause', tabId: TAB });
    await worker.send({ type: 'capture/pause', tabId: TAB });
    expect((await worker.session())?.captureState).toBe('PAUSED');
    await worker.send({ type: 'capture/resume', tabId: TAB });
    expect((await worker.session())?.captureState).toBe('RECORDING');
    await expect(worker.send({ type: 'capture/resume', tabId: TAB })).resolves.toMatchObject({
      ok: false,
    });
    await worker.send({ type: 'capture/stop', tabId: TAB });
    await worker.send({ type: 'capture/stop', tabId: TAB });
    expect((await worker.session())?.captureState).toBe('STOPPED');
    expect(offscreenCommands(worker).map((c) => c.type)).toEqual([
      'offscreen/start',
      'offscreen/pause',
      'offscreen/resume',
      'offscreen/stop',
    ]);
  });

  it('closes the recorder once it has flushed, then finalizes an ended call', async () => {
    const worker = await startWorker();
    await startCapture(worker);
    const key = (await worker.session())?.sessionKey ?? '';
    await worker.fromTab(report({ meetingState: 'ENDED' }));
    expect(worker.portal.ops('MaFinalizeSession')).toHaveLength(0);
    worker.chrome.runtime.getContexts.mockResolvedValue([{}]);
    await worker.fromOffscreen({ type: 'offscreen/notice', sessionKey: key, reason: 'stopped' });
    expect(worker.chrome.offscreen.closeDocument).toHaveBeenCalledTimes(1);
    expect(worker.portal.ops('MaFinalizeSession')).toHaveLength(1);
    await worker.fromOffscreen({
      type: 'offscreen/notice',
      sessionKey: 'unknown',
      reason: 'stopped',
    });
    expect(worker.chrome.offscreen.closeDocument).toHaveBeenCalledTimes(2);
  });

  it("shows the recorder's own errors and notices", async () => {
    const worker = await startWorker();
    await startCapture(worker);
    const key = (await worker.session())?.sessionKey ?? '';
    await worker.fromOffscreen({
      type: 'offscreen/notice',
      sessionKey: key,
      reason: 'The microphone is not available',
    });
    expect(await worker.session()).toMatchObject({
      micEnabled: false,
      captureError: 'The microphone is not available',
    });
    await worker.fromOffscreen({ type: 'offscreen/notice', sessionKey: 'unknown', reason: 'x' });
    await worker.fromOffscreen({
      type: 'offscreen/error',
      sessionKey: key,
      reason: 'The meeting audio ended',
    });
    expect(await worker.session()).toMatchObject({
      captureState: 'ERROR',
      recorderActive: false,
      captureError: 'The meeting audio ended',
    });
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

  it('stops a running capture when the page reloads', async () => {
    const worker = await startWorker();
    await startCapture(worker);
    await worker.fromTab({
      type: 'meet/hello',
      page: { meetingCode: 'abc-defg-hij', url: 'u', title: 't' },
    });
    expect(await worker.session()).toMatchObject({
      captureState: 'STOPPED',
      meetingId: 'm1',
      consentRecorded: true,
    });
  });
});
