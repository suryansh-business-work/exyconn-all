// @vitest-environment jsdom
/** Recording a voice note: start, the timer, stop and send, cancel, and the two-minute limit. */
import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useRecorder } from "../../../../../src/components/chat-embed/hooks/useRecorder";
import {
  canRecord,
  MAX_RECORDING_SECONDS,
  startRecording,
  type Recording,
} from "../../../../../src/components/chat-embed/lib/recorder";
import { strings } from "../../../../../src/components/chat-embed/strings";

vi.mock("../../../../../src/components/chat-embed/lib/recorder", async (importOriginal) => ({
  ...(await importOriginal<
    typeof import("../../../../../src/components/chat-embed/lib/recorder")
  >()),
  canRecord: vi.fn(),
  startRecording: vi.fn(),
}));

const NOTE = { name: "voice-note-1.webm", data: "data:audio/webm;base64,AAAA" };

function recording(stop: Recording["stop"] = vi.fn(async () => NOTE)) {
  const handle = { stop: vi.fn(stop), cancel: vi.fn() };
  vi.mocked(startRecording).mockResolvedValue(handle);
  return handle;
}

function mount() {
  const onDone = vi.fn();
  const onError = vi.fn();
  const view = renderHook(() => useRecorder({ onDone, onError }));
  return { ...view, onDone, onError };
}

async function started(view: ReturnType<typeof mount>) {
  await act(async () => view.result.current.start());
}

beforeEach(() => {
  vi.useFakeTimers();
  vi.mocked(canRecord).mockReturnValue(true);
  vi.mocked(startRecording).mockReset();
});

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe("useRecorder", () => {
  it("says so when the browser cannot record", () => {
    vi.mocked(canRecord).mockReturnValue(false);
    const view = mount();
    act(() => view.result.current.start());
    expect(view.onError).toHaveBeenCalledWith(strings.micUnsupported);
    expect(startRecording).not.toHaveBeenCalled();
    expect(view.result.current.active).toBe(false);
  });

  it("records, counts the seconds and hands the note over on stop", async () => {
    const handle = recording();
    const view = mount();
    await started(view);
    expect(view.result.current.active).toBe(true);
    expect(view.result.current.seconds).toBe(0);
    act(() => vi.advanceTimersByTime(3000));
    expect(view.result.current.seconds).toBe(3);
    await act(async () => view.result.current.stop());
    expect(handle.stop).toHaveBeenCalledTimes(1);
    expect(view.onDone).toHaveBeenCalledWith(NOTE);
    expect(view.result.current.active).toBe(false);
  });

  it("reports a note that fails to finish", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
    recording(async () => Promise.reject(new Error("encoder")));
    const view = mount();
    await started(view);
    await act(async () => view.result.current.stop());
    expect(view.onError).toHaveBeenCalledWith(strings.micFailed);
    expect(view.onDone).not.toHaveBeenCalled();
    expect(warn).toHaveBeenCalledWith("[chat] voice note failed", expect.any(Error));
  });

  it("throws the note away on cancel", async () => {
    const handle = recording();
    const view = mount();
    await started(view);
    act(() => view.result.current.cancel());
    expect(handle.cancel).toHaveBeenCalledTimes(1);
    expect(view.result.current.active).toBe(false);
    await act(async () => view.result.current.stop());
    expect(handle.stop).not.toHaveBeenCalled();
    expect(view.onDone).not.toHaveBeenCalled();
  });

  it("tells the visitor how to allow a blocked microphone", async () => {
    vi.spyOn(console, "warn").mockImplementation(() => undefined);
    vi.mocked(startRecording).mockRejectedValue(new DOMException("no", "NotAllowedError"));
    const view = mount();
    await started(view);
    expect(view.onError).toHaveBeenCalledWith(strings.micDenied);
    expect(view.result.current.active).toBe(false);
  });

  it("says the note failed for any other microphone problem", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
    vi.mocked(startRecording).mockRejectedValue(new DOMException("busy", "NotReadableError"));
    const view = mount();
    await started(view);
    expect(view.onError).toHaveBeenCalledWith(strings.micFailed);
    expect(warn).toHaveBeenCalledWith("[chat] microphone unavailable", expect.any(DOMException));
  });

  it("stops and sends by itself at the two-minute limit", async () => {
    const handle = recording();
    const view = mount();
    await started(view);
    await act(async () => vi.advanceTimersByTime(MAX_RECORDING_SECONDS * 1000));
    expect(handle.stop).toHaveBeenCalledTimes(1);
    expect(view.onDone).toHaveBeenCalledWith(NOTE);
    expect(view.result.current.active).toBe(false);
  });

  it("cancels a recording still running when it unmounts", async () => {
    const handle = recording();
    const view = mount();
    await started(view);
    view.unmount();
    expect(handle.cancel).toHaveBeenCalledTimes(1);
    expect(vi.getTimerCount()).toBe(0);
  });
});
