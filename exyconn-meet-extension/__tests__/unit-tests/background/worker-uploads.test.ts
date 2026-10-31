import { afterEach, describe, expect, it, vi } from 'vitest';
import { jsonResponse } from '../chrome-mock';
import { TAB, audio, joinCall, piece, startCapture, startWorker, type Worker } from './harness';

afterEach(() => vi.unstubAllGlobals());

/** Holds the next upload open until the test releases it; the portal never records that one. */
function holdNextUpload(worker: Worker): (reply: Response) => void {
  let release: (reply: Response) => void = () => undefined;
  worker.portal.fetchMock.mockImplementationOnce(
    () =>
      new Promise<Response>((resolve) => {
        release = resolve;
      }),
  );
  return (reply) => release(reply);
}

const range = (from: number, to: number): number[] =>
  Array.from({ length: to - from }, (_, index) => from + index);

describe('service worker: transcription uploads', () => {
  it('uploads WebM chunks numbered per meeting and stream, and keeps the lines for the panel', async () => {
    const worker = await startWorker();
    await startCapture(worker, TAB, true);
    worker.portal.audioReplies.push(
      jsonResponse(200, {
        status: 'DONE',
        segments: [{ id: 's1', startMs: 0, endMs: 900, text: 'Hi', speakerLabel: null }],
      }),
    );
    await worker.fromTab(audio(0));
    await worker.fromTab(audio(1));
    await worker.fromTab(audio(0, 'MIC'));
    await vi.waitFor(() => expect(worker.portal.audio).toHaveLength(3));
    expect(worker.portal.audio.map((body) => [body.stream, body.seq])).toEqual([
      ['TAB', 0],
      ['TAB', 1],
      ['MIC', 0],
    ]);
    expect(worker.portal.audio[1]).toEqual({
      meetingId: 'm1',
      stream: 'TAB',
      seq: 1,
      startMs: 15_000,
      durationMs: 15_000,
      mimeType: 'audio/webm',
      audio: 'GkXfow==',
    });
    await vi.waitFor(async () => expect((await worker.session())?.pendingUploads).toBe(0));
    await expect(
      worker.fromTab({ type: 'panel/request', request: { op: 'liveSegments' } }),
    ).resolves.toEqual({
      ok: true,
      data: [{ id: 's1', startMs: 0, endMs: 900, text: 'Hi', speakerLabel: null }],
    });
  });

  it('drops recording data for a meeting without consent on record', async () => {
    const worker = await startWorker();
    await joinCall(worker);
    await worker.fromTab(audio(0));
    await worker.fromTab(piece(0));
    expect(worker.portal.audio).toHaveLength(0);
    expect(worker.portal.video).toHaveLength(0);
  });

  it('fails the capture with a clear error when a chunk can never be uploaded', async () => {
    const worker = await startWorker();
    await startCapture(worker);
    worker.portal.audioReplies.push(jsonResponse(403, { error: 'budget_exceeded' }));
    await worker.fromTab(audio(0));
    await vi.waitFor(async () => expect((await worker.session())?.captureState).toBe('ERROR'));
    expect((await worker.session())?.captureError).toMatch(/budget/);
    expect(worker.recorderCommands()).toEqual(['recorder/stop']);
  });

  it('fails the capture of a tab whose page is already gone', async () => {
    const worker = await startWorker();
    await startCapture(worker);
    worker.chrome.tabs.goneTabs.add(TAB);
    worker.portal.audioReplies.push(jsonResponse(403, { error: 'disabled' }));
    await worker.fromTab(audio(0));
    await vi.waitFor(async () => expect((await worker.session())?.captureState).toBe('ERROR'));
    expect((await worker.session())?.recorderActive).toBe(false);
  });

  it('refreshes the token once when an upload is refused as unauthenticated', async () => {
    const worker = await startWorker();
    await startCapture(worker);
    worker.portal.audioReplies.push(jsonResponse(401, {}));
    await worker.fromTab(audio(0));
    await vi.waitFor(() => expect(worker.portal.audio).toHaveLength(2));
    expect(worker.portal.fetchMock.mock.calls.some(([u]) => u.endsWith('/auth/token'))).toBe(true);
  });

  it('pauses capture when transcription uploads fall behind, and resumes once they catch up', async () => {
    const worker = await startWorker();
    await startCapture(worker);
    const release = holdNextUpload(worker);
    for (const seq of range(0, 8)) {
      await worker.fromTab(audio(seq));
    }
    expect(await worker.session()).toMatchObject({
      captureState: 'PAUSED',
      captureError: expect.stringMatching(/falling behind/),
    });
    expect(worker.recorderCommands()).toEqual(['recorder/pause']);
    await expect(worker.fromTab({ type: 'capture/resume' })).resolves.toMatchObject({
      ok: false,
      error: expect.stringMatching(/falling behind/),
    });
    for (const seq of range(8, 13)) {
      await worker.fromTab(audio(seq));
    }
    expect(worker.portal.audio).toHaveLength(0);
    release(jsonResponse(200, { status: 'DONE' }));
    await vi.waitFor(async () => expect((await worker.session())?.pendingUploads).toBe(0));
    expect(worker.portal.audio.map((body) => body.seq)).toEqual(range(1, 12));
    await expect(worker.fromTab({ type: 'capture/resume' })).resolves.toEqual({
      ok: true,
      data: null,
    });
  });
});

describe('service worker: screen-recording uploads', () => {
  it('sends each piece as raw WebM bytes with its part and length', async () => {
    const worker = await startWorker();
    await startCapture(worker);
    await worker.fromTab(piece(3, 1));
    await vi.waitFor(() => expect(worker.portal.video).toHaveLength(1));
    expect(worker.portal.video[0]).toEqual({
      meetingId: 'm1',
      seq: 3,
      part: '1',
      durationMs: '5000',
      contentType: 'video/webm;codecs=h264,opus',
      bytes: new Uint8Array([0x1a, 0x45, 0xdf, 0xa3]),
    });
    await vi.waitFor(async () => expect((await worker.session())?.pendingUploads).toBe(0));
  });

  it('refreshes the token once when a piece is refused as unauthenticated', async () => {
    const worker = await startWorker();
    await startCapture(worker);
    worker.portal.videoReplies.push(jsonResponse(401, {}));
    await worker.fromTab(piece(0));
    await vi.waitFor(() => expect(worker.portal.video).toHaveLength(2));
    expect(worker.portal.fetchMock.mock.calls.some(([u]) => u.endsWith('/auth/token'))).toBe(true);
  });

  it('shows a lost piece without stopping transcription', async () => {
    const worker = await startWorker();
    await startCapture(worker);
    worker.portal.videoReplies.push(jsonResponse(403, { error: 'storage_full' }));
    await worker.fromTab(piece(0));
    await vi.waitFor(async () =>
      expect((await worker.session())?.captureError).toBe(
        'Part of the screen recording could not be saved',
      ),
    );
    expect((await worker.session())?.captureState).toBe('RECORDING');
    expect(worker.recorderCommands()).toEqual([]);
  });

  it('ignores a repeated piece, and pauses when pieces fall behind', async () => {
    const worker = await startWorker();
    await startCapture(worker);
    const release = holdNextUpload(worker);
    await worker.fromTab(piece(0));
    await worker.fromTab(piece(0));
    expect((await worker.session())?.captureState).toBe('RECORDING');
    for (const seq of range(1, 24)) {
      await worker.fromTab(piece(seq));
    }
    expect((await worker.session())?.captureState).toBe('PAUSED');
    await expect(worker.fromTab({ type: 'capture/resume' })).resolves.toMatchObject({
      ok: false,
      error: expect.stringMatching(/falling behind/),
    });
    release(jsonResponse(200, { status: 'STORED' }));
    await vi.waitFor(async () => expect((await worker.session())?.pendingUploads).toBe(0));
    expect(worker.portal.video.map((received) => received.seq)).toEqual(range(1, 24));
    expect(worker.recorderCommands()).toEqual(['recorder/pause']);
  });
});
