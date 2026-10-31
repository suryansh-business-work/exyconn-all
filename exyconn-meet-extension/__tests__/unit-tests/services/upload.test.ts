import { describe, expect, it, vi } from 'vitest';
import {
  MAX_CHUNK_BYTES,
  classifyUploadResponse,
  createAudioUploader,
  createUploader,
  type AudioChunk,
  type AudioUploaderOptions,
  type UploadOutcome,
} from '../../../src/services/audio-upload';
import {
  chunkKey,
  createUploadQueue,
  type UploadQueueOptions,
} from '../../../src/services/upload-queue';
import { createVideoUploader, type VideoPiece } from '../../../src/services/video-upload';
import { jsonResponse } from '../chrome-mock';

const chunk = (seq: number, overrides: Partial<AudioChunk> = {}): AudioChunk => ({
  meetingId: 'm1',
  tabId: 1,
  stream: 'TAB',
  seq,
  startMs: seq * 25_000,
  durationMs: 25_000,
  audio: 'UklGRg==',
  ...overrides,
});

describe('classifyUploadResponse', () => {
  it('reads transcript lines from a success and skips malformed ones', () => {
    const outcome = classifyUploadResponse(200, {
      status: 'DONE',
      segments: [
        { id: 's1', startMs: 0, endMs: 900, text: 'Hello', speakerLabel: 'A', language: 'en' },
        { id: 5 },
        { id: 's2', startMs: 1, endMs: 2, text: 'x' },
      ],
    });
    expect(outcome).toEqual({
      kind: 'done',
      duplicate: false,
      segments: [
        { id: 's1', startMs: 0, endMs: 900, text: 'Hello', speakerLabel: 'A' },
        { id: 's2', startMs: 1, endMs: 2, text: 'x', speakerLabel: null },
      ],
    });
    expect(classifyUploadResponse(200, { status: 'DUPLICATE' })).toEqual({
      kind: 'done',
      duplicate: true,
      segments: [],
    });
    expect(classifyUploadResponse(200, null)).toEqual({
      kind: 'done',
      duplicate: false,
      segments: [],
    });
  });

  it('retries busy, rate-limited and server failures', () => {
    expect(classifyUploadResponse(429, { error: 'busy', retryAfterMs: 4000 })).toEqual({
      kind: 'retry',
      reason: 'busy',
      retryAfterMs: 4000,
    });
    expect(classifyUploadResponse(429, {})).toEqual({
      kind: 'retry',
      reason: 'rate_limited',
      retryAfterMs: 0,
    });
    expect(classifyUploadResponse(502, { error: 'transcription_failed' })).toEqual({
      kind: 'retry',
      reason: 'transcription_failed',
      retryAfterMs: 0,
    });
    expect(classifyUploadResponse(503, null)).toEqual({
      kind: 'retry',
      reason: 'server_error',
      retryAfterMs: 0,
    });
  });

  it('stops on consent, end, budget, format and size errors', () => {
    expect(classifyUploadResponse(409, { error: 'consent_required' })).toEqual({
      kind: 'fatal',
      reason: 'consent_required',
    });
    expect(classifyUploadResponse(403, { error: 'budget_exceeded' })).toEqual({
      kind: 'fatal',
      reason: 'budget_exceeded',
    });
    expect(classifyUploadResponse(415, { error: 'unsupported_audio' })).toEqual({
      kind: 'fatal',
      reason: 'unsupported_audio',
    });
    expect(classifyUploadResponse(413, null)).toEqual({ kind: 'fatal', reason: 'too_large' });
    expect(classifyUploadResponse(400, null)).toEqual({ kind: 'fatal', reason: 'http_400' });
  });
});

function uploader(overrides: Partial<AudioUploaderOptions>, ...responses: Array<Response | Error>) {
  const fetchImpl = vi.fn<AudioUploaderOptions['fetchImpl']>();
  for (const response of responses) {
    if (response instanceof Error) {
      fetchImpl.mockRejectedValueOnce(response);
    } else {
      fetchImpl.mockResolvedValueOnce(response);
    }
  }
  const options: AudioUploaderOptions = {
    apiUrl: 'https://api.test',
    fetchImpl,
    getAccessToken: vi.fn(() => Promise.resolve('a1')),
    refreshAccessToken: vi.fn(() => Promise.resolve('a2')),
    ...overrides,
  };
  return {
    upload: createAudioUploader(options),
    uploadVideo: createVideoUploader(options),
    fetchImpl,
    options,
  };
}

const piece = (overrides: Partial<VideoPiece> = {}): VideoPiece => ({
  meetingId: 'm1',
  tabId: 1,
  stream: 'SCREEN-2',
  part: 2,
  seq: 4,
  durationMs: 4999.6,
  data: 'GkXfow==',
  ...overrides,
});

describe('audio uploader', () => {
  it('posts the WebM chunk as JSON with its identity and type', async () => {
    const { upload, fetchImpl } = uploader({}, jsonResponse(200, { status: 'DONE', segments: [] }));
    await expect(upload(chunk(3, { startMs: -4.2, durationMs: 24_999.6 }))).resolves.toMatchObject({
      kind: 'done',
    });
    const [url, init] = fetchImpl.mock.calls[0];
    expect(url).toBe('https://api.test/meet-assistant/audio');
    expect(init.headers).toEqual({
      Authorization: 'Bearer a1',
      'Content-Type': 'application/json',
    });
    expect(JSON.parse(String(init.body))).toEqual({
      meetingId: 'm1',
      stream: 'TAB',
      seq: 3,
      startMs: 0,
      durationMs: 25_000,
      mimeType: 'audio/webm',
      audio: 'UklGRg==',
    });
  });

  it('refreshes once on 401', async () => {
    const { upload, fetchImpl } = uploader(
      {},
      jsonResponse(401, {}),
      jsonResponse(200, { status: 'DONE' }),
    );
    await expect(upload(chunk(0))).resolves.toMatchObject({ kind: 'done' });
    expect(fetchImpl.mock.calls[1][1].headers).toMatchObject({ Authorization: 'Bearer a2' });
  });

  it('gives up as signed out when there is no token or the refresh fails', async () => {
    await expect(
      uploader({ getAccessToken: vi.fn(() => Promise.resolve(null)) }).upload(chunk(0)),
    ).resolves.toEqual({ kind: 'fatal', reason: 'signed_out' });
    await expect(
      uploader(
        { refreshAccessToken: vi.fn(() => Promise.resolve(null)) },
        jsonResponse(401, {}),
      ).upload(chunk(0)),
    ).resolves.toEqual({ kind: 'fatal', reason: 'signed_out' });
    await expect(
      uploader({}, jsonResponse(401, {}), jsonResponse(401, {})).upload(chunk(0)),
    ).resolves.toEqual({ kind: 'fatal', reason: 'signed_out' });
  });

  it('retries after a network failure', async () => {
    await expect(uploader({}, new TypeError('offline')).upload(chunk(0))).resolves.toEqual({
      kind: 'retry',
      reason: 'NETWORK',
      retryAfterMs: 0,
    });
    const throwing = uploader({
      getAccessToken: vi.fn(() => Promise.reject(new Error('x'))),
    });
    await expect(throwing.upload(chunk(0))).resolves.toEqual({
      kind: 'retry',
      reason: 'network',
      retryAfterMs: 0,
    });
  });

  it('refuses a chunk over 8 MB decoded without sending it', async () => {
    const big = 'A'.repeat(Math.ceil((MAX_CHUNK_BYTES + 3) / 3) * 4);
    const { upload, fetchImpl } = uploader({});
    await expect(upload(chunk(0, { audio: big }))).resolves.toEqual({
      kind: 'fatal',
      reason: 'too_large',
    });
    expect(fetchImpl).not.toHaveBeenCalled();
  });
});

describe('shared uploader', () => {
  it('checks the size with the given measure and sends with the token', async () => {
    const send = vi.fn((_chunk: string, _token: string) =>
      Promise.resolve({ status: 200, body: { status: 'DONE' } }),
    );
    const options: AudioUploaderOptions = {
      apiUrl: 'https://api.test',
      fetchImpl: vi.fn(),
      getAccessToken: () => Promise.resolve('a1'),
      refreshAccessToken: () => Promise.resolve('a2'),
    };
    const upload = createUploader<string>(options, (text) => text.length, send);
    await expect(upload('small')).resolves.toMatchObject({ kind: 'done' });
    expect(send).toHaveBeenCalledWith('small', 'a1');
    await expect(upload('x'.repeat(MAX_CHUNK_BYTES + 1))).resolves.toEqual({
      kind: 'fatal',
      reason: 'too_large',
    });
    expect(send).toHaveBeenCalledTimes(1);
  });
});

describe('video uploader', () => {
  it('posts the raw WebM piece to its part and sequence number', async () => {
    const { uploadVideo, fetchImpl } = uploader({}, jsonResponse(200, { status: 'SAVED' }));
    await expect(uploadVideo(piece())).resolves.toEqual({
      kind: 'done',
      duplicate: false,
      segments: [],
    });
    const [url, init] = fetchImpl.mock.calls[0];
    const parsed = new URL(url);
    expect(parsed.origin + parsed.pathname).toBe('https://api.test/meet-assistant/video/m1/4');
    expect(Object.fromEntries(parsed.searchParams)).toEqual({ part: '2', durationMs: '5000' });
    expect(init.method).toBe('POST');
    expect(init.headers).toEqual({
      Authorization: 'Bearer a1',
      'Content-Type': 'video/webm;codecs=h264,opus',
    });
    expect(init.body).toEqual(Uint8Array.from([0x1a, 0x45, 0xdf, 0xa3]));
  });

  it('sends at least 1 ms of duration', async () => {
    const { uploadVideo, fetchImpl } = uploader({}, jsonResponse(200, {}));
    await uploadVideo(piece({ durationMs: 0.2 }));
    expect(new URL(fetchImpl.mock.calls[0][0]).searchParams.get('durationMs')).toBe('1');
  });

  it('refreshes once on 401, and gives up as signed out without a token', async () => {
    const { uploadVideo, fetchImpl } = uploader(
      {},
      jsonResponse(401, {}),
      jsonResponse(200, { status: 'SAVED' }),
    );
    await expect(uploadVideo(piece())).resolves.toMatchObject({ kind: 'done' });
    expect(fetchImpl.mock.calls[1][1].headers).toMatchObject({ Authorization: 'Bearer a2' });
    await expect(
      uploader(
        { refreshAccessToken: vi.fn(() => Promise.resolve(null)) },
        jsonResponse(401, {}),
      ).uploadVideo(piece()),
    ).resolves.toEqual({ kind: 'fatal', reason: 'signed_out' });
  });

  it('refuses a piece over 8 MB decoded, and maps server answers', async () => {
    const big = 'A'.repeat(Math.ceil((MAX_CHUNK_BYTES + 3) / 3) * 4);
    const { uploadVideo, fetchImpl } = uploader({}, jsonResponse(413, {}));
    await expect(uploadVideo(piece({ data: big }))).resolves.toEqual({
      kind: 'fatal',
      reason: 'too_large',
    });
    expect(fetchImpl).not.toHaveBeenCalled();
    await expect(uploadVideo(piece())).resolves.toEqual({ kind: 'fatal', reason: 'too_large' });
  });
});

/** A queue whose uploads answer from a script and whose timers run when the test says so. */
function queue(outcomes: UploadOutcome[], overrides: Partial<UploadQueueOptions<AudioChunk>> = {}) {
  const timers: Array<{ run: () => void; delay: number }> = [];
  const upload = vi.fn((_chunk: AudioChunk): Promise<UploadOutcome> =>
    Promise.resolve(outcomes.shift() ?? { kind: 'done', duplicate: false, segments: [] }),
  );
  const options: UploadQueueOptions<AudioChunk> = {
    upload,
    capacity: 4,
    highWater: 3,
    maxAttempts: 3,
    backoff: { baseMs: 1000, maxMs: 10_000 },
    schedule: (run, delay) => timers.push({ run, delay }),
    onUploaded: vi.fn(),
    onFailed: vi.fn(),
    onSizeChange: vi.fn(),
    onError: vi.fn(),
    ...overrides,
  };
  return { q: createUploadQueue(options), upload, timers, options };
}

const settle = () => new Promise((resolve) => setTimeout(resolve, 0));
const retry = (afterMs = 0): UploadOutcome => ({
  kind: 'retry',
  reason: 'busy',
  retryAfterMs: afterMs,
});

describe('upload queue', () => {
  it('uploads in order and reports each result', async () => {
    const { q, upload, options } = queue([]);
    q.enqueue(chunk(0));
    q.enqueue(chunk(1));
    await settle();
    expect(upload.mock.calls.map(([c]) => c.seq)).toEqual([0, 1]);
    expect(options.onUploaded).toHaveBeenCalledTimes(2);
    expect(q.size()).toBe(0);
    expect(options.onSizeChange).toHaveBeenLastCalledWith('m1', 0);
  });

  it('retries with exponential backoff, honouring retry-after', async () => {
    const { q, upload, timers } = queue([retry(), retry(5000)]);
    q.enqueue(chunk(0));
    await settle();
    expect(timers.map((t) => t.delay)).toEqual([1000]);
    timers[0].run();
    await settle();
    expect(timers.map((t) => t.delay)).toEqual([1000, 5000]);
    timers[1].run();
    await settle();
    expect(upload).toHaveBeenCalledTimes(3);
    expect(q.size()).toBe(0);
  });

  it('fails a chunk after the maximum attempts and moves on', async () => {
    const { q, timers, options } = queue([retry(), retry(), retry()]);
    q.enqueue(chunk(0));
    q.enqueue(chunk(1));
    await settle();
    timers[0].run();
    await settle();
    timers[1].run();
    await settle();
    expect(options.onFailed).toHaveBeenCalledWith(
      expect.objectContaining({ seq: 0 }),
      'max_attempts',
    );
    expect(options.onUploaded).toHaveBeenCalledWith(
      expect.objectContaining({ seq: 1 }),
      expect.anything(),
    );
  });

  it('fails at once on a fatal answer', async () => {
    const { q, upload, options } = queue([{ kind: 'fatal', reason: 'consent_required' }]);
    q.enqueue(chunk(0));
    await settle();
    expect(upload).toHaveBeenCalledTimes(1);
    expect(options.onFailed).toHaveBeenCalledWith(
      expect.objectContaining({ seq: 0 }),
      'consent_required',
    );
  });

  it('never accepts the same chunk twice', async () => {
    const { q, upload } = queue([]);
    expect(q.enqueue(chunk(0))).toEqual({ accepted: true, backpressure: false });
    expect(q.enqueue(chunk(0))).toEqual({ accepted: false, reason: 'duplicate' });
    await settle();
    expect(q.enqueue(chunk(0))).toEqual({ accepted: false, reason: 'duplicate' });
    expect(upload).toHaveBeenCalledTimes(1);
    expect(chunkKey(chunk(0))).toBe('m1:TAB:0');
  });

  it('signals backpressure at the high-water mark and refuses past capacity, dropping nothing', async () => {
    const { q, timers } = queue([retry()]);
    expect(q.enqueue(chunk(0)).accepted).toBe(true);
    await settle();
    expect(q.enqueue(chunk(1))).toEqual({ accepted: true, backpressure: false });
    expect(q.enqueue(chunk(2))).toEqual({ accepted: true, backpressure: true });
    expect(q.enqueue(chunk(3))).toEqual({ accepted: true, backpressure: true });
    expect(q.enqueue(chunk(4))).toEqual({ accepted: false, reason: 'full' });
    expect(q.size()).toBe(4);
    expect(q.sizeFor('m1')).toBe(4);
    expect(q.sizeFor('other')).toBe(0);
    timers[0].run();
    await settle();
    expect(q.size()).toBe(0);
  });

  it('queues any chunk kind by its own identity', async () => {
    const upload = vi.fn((_piece: VideoPiece) =>
      Promise.resolve<UploadOutcome>({ kind: 'done', duplicate: false, segments: [] }),
    );
    const q = createUploadQueue<VideoPiece>({
      upload,
      capacity: 2,
      highWater: 2,
      maxAttempts: 1,
      backoff: { baseMs: 1, maxMs: 1 },
      schedule: vi.fn(),
      onUploaded: vi.fn(),
      onFailed: vi.fn(),
      onSizeChange: vi.fn(),
      onError: vi.fn(),
    });
    expect(q.enqueue(piece({ seq: 0 }))).toEqual({ accepted: true, backpressure: false });
    expect(q.enqueue(piece({ seq: 0, stream: 'SCREEN-3' }))).toEqual({
      accepted: true,
      backpressure: true,
    });
    await settle();
    expect(upload.mock.calls.map(([p]) => p.stream)).toEqual(['SCREEN-2', 'SCREEN-3']);
    expect(chunkKey(piece())).toBe('m1:SCREEN-2:4');
  });

  it('reports a throwing callback and restarts on the next chunk', async () => {
    const onUploaded = vi.fn().mockImplementationOnce(() => {
      throw new Error('listener broke');
    });
    const { q, upload, options } = queue([], { onUploaded });
    q.enqueue(chunk(0));
    await settle();
    expect(options.onError).toHaveBeenCalledWith(expect.any(Error));
    q.enqueue(chunk(1));
    await settle();
    expect(upload).toHaveBeenCalledTimes(2);
  });
});
