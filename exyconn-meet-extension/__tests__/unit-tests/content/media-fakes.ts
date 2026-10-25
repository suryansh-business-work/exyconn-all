import { vi } from 'vitest';

/**
 * jsdom has no media capture: these fakes stand in for MediaStreamTrack, MediaStream,
 * MediaRecorder, AudioContext and navigator.mediaDevices, with just the behaviour the
 * recorder relies on.
 */
export class FakeTrack extends EventTarget {
  readyState: MediaStreamTrackState = 'live';
  readonly stop = vi.fn(() => {
    this.readyState = 'ended';
  });

  constructor(readonly kind: 'audio' | 'video') {
    super();
  }

  /** The browser ended the track (e.g. the user clicked "Stop sharing"). */
  end(): void {
    this.readyState = 'ended';
    this.dispatchEvent(new Event('ended'));
  }
}

export class FakeStream {
  readonly tracks: FakeTrack[];

  constructor(tracks: readonly FakeTrack[] = []) {
    this.tracks = [...tracks];
  }

  getTracks(): FakeTrack[] {
    return [...this.tracks];
  }

  getAudioTracks(): FakeTrack[] {
    return this.tracks.filter((track) => track.kind === 'audio');
  }

  getVideoTracks(): FakeTrack[] {
    return this.tracks.filter((track) => track.kind === 'video');
  }
}

/** A tab share: one video track and, unless told otherwise, the tab's audio. */
export function tabStream({ audio = true } = {}): FakeStream {
  const tracks = [new FakeTrack('video')];
  if (audio) {
    tracks.push(new FakeTrack('audio'));
  }
  return new FakeStream(tracks);
}

export const micStream = (): FakeStream => new FakeStream([new FakeTrack('audio')]);

type DataHandler = ((event: { data: Blob }) => void) | null;

/**
 * MediaRecorder's state machine: start(timeslice) records, requestData() and stop() hand
 * over what is recorded (stop also fires `onstop` and a `stop` event), pause/resume toggle.
 */
export class FakeRecorder extends EventTarget {
  static readonly instances: FakeRecorder[] = [];
  /** The bytes the next hand-over carries; tests change it to simulate an empty piece. */
  static nextData = 'webm';
  /** The next construction throws, as Chrome does for a stream it can no longer record. */
  static failNext = false;

  state: RecordingState = 'inactive';
  readonly mimeType: string;
  timeslice: number | undefined;
  ondataavailable: DataHandler = null;
  onstop: (() => void) | null = null;

  constructor(
    readonly stream: FakeStream,
    readonly options: MediaRecorderOptions,
  ) {
    super();
    if (FakeRecorder.failNext) {
      FakeRecorder.failNext = false;
      throw new Error('NotSupportedError');
    }
    this.mimeType = options.mimeType ?? '';
    FakeRecorder.instances.push(this);
  }

  start(timeslice?: number): void {
    this.state = 'recording';
    this.timeslice = timeslice;
  }

  /** Hands over what is recorded since the last hand-over. */
  emitData(data = FakeRecorder.nextData): void {
    this.ondataavailable?.({ data: new Blob([data], { type: this.mimeType }) });
  }

  requestData(): void {
    this.emitData();
  }

  pause(): void {
    this.state = 'paused';
  }

  resume(): void {
    this.state = 'recording';
  }

  stop(): void {
    this.state = 'inactive';
    this.emitData();
    this.onstop?.();
    this.dispatchEvent(new Event('stop'));
  }
}

export class FakeAudioContext {
  static readonly instances: FakeAudioContext[] = [];
  readonly sources: Array<{ stream: FakeStream; connect: ReturnType<typeof vi.fn> }> = [];
  readonly destination = { stream: new FakeStream([new FakeTrack('audio')]) };
  readonly close = vi.fn(() => Promise.resolve());

  constructor() {
    FakeAudioContext.instances.push(this);
  }

  createMediaStreamDestination() {
    return this.destination;
  }

  createMediaStreamSource(stream: FakeStream) {
    const source = { stream, connect: vi.fn() };
    this.sources.push(source);
    return source;
  }
}

/** Installs the fakes and a navigator.mediaDevices whose answers each test sets. */
export function installMedia() {
  FakeRecorder.instances.length = 0;
  FakeRecorder.nextData = 'webm';
  FakeRecorder.failNext = false;
  FakeAudioContext.instances.length = 0;
  vi.stubGlobal('MediaRecorder', FakeRecorder);
  vi.stubGlobal('MediaStream', FakeStream);
  vi.stubGlobal('AudioContext', FakeAudioContext);
  const devices = {
    getDisplayMedia: vi.fn<(options: unknown) => Promise<FakeStream>>(),
    getUserMedia: vi.fn<(options: unknown) => Promise<FakeStream>>(),
  };
  Object.defineProperty(navigator, 'mediaDevices', { value: devices, configurable: true });
  return devices;
}
