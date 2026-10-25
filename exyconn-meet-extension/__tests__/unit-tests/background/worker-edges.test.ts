import { afterEach, describe, expect, it, vi } from 'vitest';
import { ORG } from '../fake-portal';
import { TAB, hello, joinCall, startWorker } from './harness';

afterEach(() => {
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

describe('live segments', () => {
  it('keeps lines per meeting, in time order, deduplicated, and forgets them', async () => {
    const { addLiveSegments, forgetLiveSegments, liveSegments } =
      await import('../../../src/background/live-segments');
    expect(liveSegments('m9')).toEqual([]);
    addLiveSegments('m9', []);
    addLiveSegments('m9', [{ id: 'b', startMs: 20, endMs: 30, text: 'two', speakerLabel: null }]);
    addLiveSegments('m9', [
      { id: 'a', startMs: 10, endMs: 20, text: 'one', speakerLabel: null },
      { id: 'b', startMs: 20, endMs: 30, text: 'two, corrected', speakerLabel: null },
    ]);
    expect(liveSegments('m9').map((line) => line.text)).toEqual(['one', 'two, corrected']);
    forgetLiveSegments('m9');
    expect(liveSegments('m9')).toEqual([]);
  });
});

describe('worker edge cases', () => {
  it('reads corrupt cached company context and translations as missing', async () => {
    const worker = await startWorker();
    await worker.chrome.storage.session.set({ org: 'corrupt' });
    await worker.chrome.storage.local.set({ i18n: { locale: 5 } });
    await expect(worker.send({ type: 'state/get' })).resolves.toMatchObject({
      data: { auth: { org: ORG } },
    });
    await expect(worker.send({ type: 'i18n/messages' })).resolves.toEqual({
      ok: true,
      data: { 'Remind later': 'Later' },
    });
  });

  it('ending an unknown tab does nothing', async () => {
    const worker = await startWorker();
    const { endSession } = await import('../../../src/background/meeting');
    await endSession(404, true);
    expect(worker.portal.ops('MaFinalizeSession')).toHaveLength(0);
  });

  it('skips the heartbeat of a call whose server session never opened', async () => {
    const worker = await startWorker();
    worker.portal.graphql.MaStartSession = () => {
      throw new Error('down');
    };
    await joinCall(worker);
    worker.alarm('heartbeat');
    await vi.waitFor(() =>
      expect(worker.portal.ops('MaExtensionContext').length).toBeGreaterThan(0),
    );
    expect(worker.portal.ops('MaHeartbeat')).toHaveLength(0);
  });

  it('paints an idle badge for a tab it does not know', async () => {
    const worker = await startWorker();
    const { publish } = await import('../../../src/background/state');
    await publish(404);
    expect(worker.chrome.action.setBadgeText).toHaveBeenCalledWith({ tabId: 404, text: '' });
  });

  it('waits before retrying an upload', async () => {
    await startWorker();
    const { scheduleRetry } = await import('../../../src/background/uploads');
    vi.useFakeTimers();
    const run = vi.fn();
    scheduleRetry(run, 2000);
    vi.advanceTimersByTime(1999);
    expect(run).not.toHaveBeenCalled();
    vi.advanceTimersByTime(1);
    expect(run).toHaveBeenCalledTimes(1);
  });

  it('opens a fresh page session for a new tab', async () => {
    const worker = await startWorker();
    await worker.fromTab(hello(), TAB);
    expect(await worker.session()).toMatchObject({ meetingState: 'PAGE_OPENED', meetingId: null });
  });
});

describe('worker capture edges', () => {
  it('stops an errored capture without commanding a recorder that already stopped', async () => {
    const { startCapture: begin } = await import('./harness');
    const worker = await startWorker();
    await begin(worker);
    const { failCapture } = await import('../../../src/background/capture');
    worker.chrome.tabs.goneTabs.add(TAB);
    await failCapture('m1', 'The meeting audio ended');
    expect(await worker.session()).toMatchObject({ captureState: 'ERROR', recorderActive: false });
    worker.chrome.tabs.goneTabs.delete(TAB);
    await worker.send({ type: 'capture/stop', tabId: TAB });
    expect(worker.recorderCommands()).toEqual(['recorder/stop']);
    expect((await worker.session())?.captureState).toBe('STOPPED');
  });

  it('keeps an ended call that never reached the server', async () => {
    const { report } = await import('./harness');
    const worker = await startWorker();
    worker.portal.graphql.MaStartSession = () => {
      throw new Error('down');
    };
    await joinCall(worker);
    await worker.fromTab(report({ meetingState: 'ENDED' }));
    expect(await worker.session()).toMatchObject({ meetingState: 'ENDED', meetingId: null });
  });
});
