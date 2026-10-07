// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi, type MockInstance } from 'vitest';
import { grabWebcamFrame, loadImage } from '../../../../src/renderer/capture/webcam';

/** jsdom never decodes images; this one "loads" any source unless it names a broken payload. */
class FakeImage {
  onload: (() => void) | null = null;
  onerror: (() => void) | null = null;
  source = '';

  set src(value: string) {
    this.source = value;
    queueMicrotask(() => {
      if (value.includes('broken')) {
        this.onerror?.();
      } else {
        this.onload?.();
      }
    });
  }

  get src(): string {
    return this.source;
  }
}

describe('loadImage', () => {
  beforeEach(() => {
    vi.stubGlobal('Image', FakeImage);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('builds a data URL from the MIME type and base64 and resolves the decoded image', async () => {
    const image = await loadImage('QUJD', 'image/png');
    expect(image).toBeInstanceOf(FakeImage);
    expect(image.src).toBe('data:image/png;base64,QUJD');
  });

  it('keeps a JPEG capture as JPEG', async () => {
    const image = await loadImage('/9j/', 'image/jpeg');
    expect(image.src).toBe('data:image/jpeg;base64,/9j/');
  });

  it('rejects with a readable message when the capture cannot be decoded', async () => {
    await expect(loadImage('broken', 'image/png')).rejects.toThrow(
      'The screen capture could not be decoded.',
    );
  });
});

interface FakeStream {
  stop: ReturnType<typeof vi.fn>;
  getTracks: () => Array<{ stop: () => void }>;
}

function fakeStream(): FakeStream {
  const stop = vi.fn();
  return { stop, getTracks: () => [{ stop }, { stop }] };
}

function installCamera(
  getUserMedia: (constraints: MediaStreamConstraints) => Promise<unknown>,
): void {
  Object.defineProperty(navigator, 'mediaDevices', {
    value: { getUserMedia },
    configurable: true,
  });
}

describe('grabWebcamFrame', () => {
  let play: MockInstance<() => Promise<void>>;

  beforeEach(() => {
    play = vi.spyOn(HTMLMediaElement.prototype, 'play').mockResolvedValue(undefined);
    vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => {
      callback(0);
      return 1;
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
    Reflect.deleteProperty(navigator, 'mediaDevices');
  });

  it('asks for a 640x480 video stream without audio', async () => {
    const getUserMedia = vi.fn(() => Promise.resolve(fakeStream()));
    installCamera(getUserMedia);
    await grabWebcamFrame();
    expect(getUserMedia).toHaveBeenCalledWith({
      video: { width: { ideal: 640 }, height: { ideal: 480 } },
      audio: false,
    });
  });

  it('returns a muted, playing video of the stream and releases the camera straight away', async () => {
    const stream = fakeStream();
    installCamera(() => Promise.resolve(stream));
    const video = await grabWebcamFrame();
    expect(video.tagName).toBe('VIDEO');
    expect(video.srcObject).toBe(stream);
    expect(video.muted).toBe(true);
    expect(play).toHaveBeenCalledTimes(1);
    expect(stream.stop).toHaveBeenCalledTimes(2);
  });

  it('waits a frame after play so the camera hands over a metered picture', async () => {
    const stream = fakeStream();
    installCamera(() => Promise.resolve(stream));
    const frames: FrameRequestCallback[] = [];
    vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => {
      frames.push(callback);
      return 1;
    });
    let settled = false;
    const grabbing = grabWebcamFrame().then((video) => {
      settled = true;
      return video;
    });
    await vi.waitFor(() => expect(frames).toHaveLength(1));
    expect(settled).toBe(false);
    expect(stream.stop).not.toHaveBeenCalled();
    frames[0](0);
    await grabbing;
    expect(settled).toBe(true);
    expect(stream.stop).toHaveBeenCalledTimes(2);
  });

  it('still releases the camera when the video will not play', async () => {
    const stream = fakeStream();
    installCamera(() => Promise.resolve(stream));
    play.mockRejectedValue(new Error('NotAllowedError'));
    await expect(grabWebcamFrame()).rejects.toThrow('NotAllowedError');
    expect(stream.stop).toHaveBeenCalledTimes(2);
  });

  it('passes on a refused camera without touching any track', async () => {
    installCamera(() => Promise.reject(new Error('Permission denied')));
    await expect(grabWebcamFrame()).rejects.toThrow('Permission denied');
    expect(play).not.toHaveBeenCalled();
  });
});
