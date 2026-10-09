// @vitest-environment jsdom
/** Voice notes: whether the browser can record, the note as a file, and a refused microphone. */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  MAX_RECORDING_SECONDS,
  canRecord,
  isPermissionDenied,
  startRecording,
} from "../../../../../src/components/chat-embed/lib/recorder";

type Listener = (event: { data?: Blob }) => void;

/** A MediaRecorder that hands over one chunk of audio when it stops. */
const fakeRecorder: { mimeType: string; last: FakeRecorder | undefined } = {
  mimeType: "audio/webm;codecs=opus",
  last: undefined,
};

class FakeRecorder {
  state: "inactive" | "recording" = "inactive";
  readonly mimeType = fakeRecorder.mimeType;
  readonly stop = vi.fn(() => {
    this.state = "inactive";
    this.emit("dataavailable", { data: new Blob(["abc"], { type: this.mimeType }) });
    this.emit("stop", {});
  });
  private readonly listeners = new Map<string, Listener>();

  constructor() {
    fakeRecorder.last = this;
  }

  addEventListener(type: string, listener: Listener): void {
    this.listeners.set(type, listener);
  }

  start(): void {
    this.state = "recording";
  }

  private emit(type: string, event: { data?: Blob }): void {
    this.listeners.get(type)?.(event);
  }
}

const tracks = [{ stop: vi.fn() }, { stop: vi.fn() }];
const getUserMedia = vi.fn();

function allowMicrophone(): void {
  vi.stubGlobal("MediaRecorder", FakeRecorder);
  Object.defineProperty(navigator, "mediaDevices", {
    configurable: true,
    value: { getUserMedia },
  });
}

beforeEach(() => {
  fakeRecorder.mimeType = "audio/webm;codecs=opus";
  getUserMedia.mockReset().mockResolvedValue({ getTracks: () => tracks });
  tracks.forEach((track) => track.stop.mockReset());
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
  Reflect.deleteProperty(navigator, "mediaDevices");
});

describe("canRecord", () => {
  it("is false without MediaRecorder or a microphone API", () => {
    expect(canRecord()).toBe(false);
    vi.stubGlobal("MediaRecorder", FakeRecorder);
    expect(canRecord()).toBe(false);
  });

  it("is true when both are there", () => {
    allowMicrophone();
    expect(canRecord()).toBe(true);
  });
});

describe("startRecording", () => {
  it("hands back the note as a data URL named after when it was made", async () => {
    allowMicrophone();
    vi.spyOn(Date, "now").mockReturnValue(1_700_000_000_000);
    const recording = await startRecording();
    expect(getUserMedia).toHaveBeenCalledWith({ audio: true });
    expect(fakeRecorder.last?.state).toBe("recording");

    await expect(recording.stop()).resolves.toEqual({
      name: "voice-note-1700000000000.webm",
      data: "data:audio/webm;base64,YWJj",
    });
    expect(tracks.every((track) => track.stop.mock.calls.length === 1)).toBe(true);
  });

  it.each([
    ["audio/mp4", "m4a"],
    ["audio/ogg", "ogg"],
    ["audio/x-unknown", "webm"],
  ])("names a %s note with the .%s extension", async (mimeType, extension) => {
    allowMicrophone();
    fakeRecorder.mimeType = mimeType;
    const note = await (await startRecording()).stop();
    expect(note.name.endsWith(`.${extension}`)).toBe(true);
    expect(note.data.startsWith(`data:${mimeType};base64,`)).toBe(true);
  });

  it("cancels by stopping the recorder once and releasing the microphone", async () => {
    allowMicrophone();
    const recording = await startRecording();
    recording.cancel();
    recording.cancel();
    expect(fakeRecorder.last?.stop).toHaveBeenCalledTimes(1);
    expect(tracks[0].stop).toHaveBeenCalledTimes(2);
  });

  it("rejects with the browser's error when the microphone is refused", async () => {
    allowMicrophone();
    const refused = new DOMException("Permission denied", "NotAllowedError");
    getUserMedia.mockRejectedValue(refused);
    await expect(startRecording()).rejects.toBe(refused);
  });

  it("stops on its own after two minutes", () => {
    expect(MAX_RECORDING_SECONDS).toBe(120);
  });
});

describe("isPermissionDenied", () => {
  it("recognises a refusal by the visitor or by a policy", () => {
    expect(isPermissionDenied(new DOMException("no", "NotAllowedError"))).toBe(true);
    expect(isPermissionDenied(new DOMException("no", "SecurityError"))).toBe(true);
  });

  it("does not treat other failures as a refusal", () => {
    expect(isPermissionDenied(new DOMException("none", "NotFoundError"))).toBe(false);
    expect(isPermissionDenied(new Error("NotAllowedError"))).toBe(false);
    expect(isPermissionDenied("NotAllowedError")).toBe(false);
  });
});
