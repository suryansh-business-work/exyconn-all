// @vitest-environment jsdom
/** Picking pictures and clips for the next live message. */
import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useAttachments } from "../../../../../src/components/chat-embed/hooks/useAttachments";
import { readDataUrl } from "../../../../../src/components/chat-embed/lib/files";
import { strings } from "../../../../../src/components/chat-embed/strings";

vi.mock("../../../../../src/components/chat-embed/lib/files", async (importOriginal) => ({
  ...(await importOriginal<typeof import("../../../../../src/components/chat-embed/lib/files")>()),
  readDataUrl: vi.fn(),
}));

const MB = 1024 * 1024;

function file(name: string, type: string, size = 10): File {
  const picked = new File(["x"], name, { type });
  Object.defineProperty(picked, "size", { value: size });
  return picked;
}

function mount(maxMb = 2) {
  const onError = vi.fn();
  const view = renderHook(() => useAttachments(maxMb, onError));
  return { ...view, onError };
}

beforeEach(() => {
  vi.mocked(readDataUrl).mockImplementation(async (blob) => `data:${blob.type};base64,AAAA`);
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("useAttachments", () => {
  it("starts empty", () => {
    const { result } = mount();
    expect(result.current.files).toEqual([]);
  });

  it("reads accepted pictures and clips into previews with unique ids", async () => {
    const { result, onError } = mount();
    await act(() => result.current.add([file("a.png", "image/png"), file("b.mp4", "video/mp4")]));
    const { files } = result.current;
    expect(files.map(({ name, data }) => ({ name, data }))).toEqual([
      { name: "a.png", data: "data:image/png;base64,AAAA" },
      { name: "b.mp4", data: "data:video/mp4;base64,AAAA" },
    ]);
    expect(new Set(files.map((picked) => picked.id)).size).toBe(2);
    expect(onError).not.toHaveBeenCalled();
  });

  it("refuses more than four files in total", async () => {
    const { result, onError } = mount();
    await act(() => result.current.add([file("1.png", "image/png"), file("2.png", "image/png")]));
    const three = ["3", "4", "5"].map((name) => file(`${name}.png`, "image/png"));
    await act(() => result.current.add(three));
    expect(onError).toHaveBeenCalledWith(strings.tooManyFiles);
    expect(result.current.files).toHaveLength(2);
  });

  it("refuses a file that is not a picture or a clip, and keeps none of the batch", async () => {
    const { result, onError } = mount();
    await act(() =>
      result.current.add([file("ok.png", "image/png"), file("cv.pdf", "application/pdf")])
    );
    expect(onError).toHaveBeenCalledWith(strings.fileType("cv.pdf"));
    expect(result.current.files).toEqual([]);
  });

  it("refuses a voice note picked as a file", async () => {
    const { result, onError } = mount();
    await act(() => result.current.add([file("note.webm", "audio/webm")]));
    expect(onError).toHaveBeenCalledWith(strings.fileType("note.webm"));
  });

  it("refuses a file over the upload limit, and accepts one exactly at it", async () => {
    const { result, onError } = mount(2);
    await act(() => result.current.add([file("big.png", "image/png", 2 * MB + 1)]));
    expect(onError).toHaveBeenCalledWith(strings.fileTooBig("big.png", 2));
    await act(() => result.current.add([file("edge.png", "image/png", 2 * MB)]));
    expect(result.current.files.map((picked) => picked.name)).toEqual(["edge.png"]);
  });

  it("says when a file cannot be read", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
    vi.mocked(readDataUrl).mockRejectedValueOnce(new Error("broken"));
    const { result, onError } = mount();
    await act(() => result.current.add([file("a.png", "image/png")]));
    expect(onError).toHaveBeenCalledWith(strings.fileUnreadable);
    expect(warn).toHaveBeenCalledWith("[chat] could not read a file", expect.any(Error));
    expect(result.current.files).toEqual([]);
  });

  it("removes one file by id and clears them all", async () => {
    const { result } = mount();
    await act(() => result.current.add([file("a.png", "image/png"), file("b.png", "image/png")]));
    const [first, second] = result.current.files;
    act(() => result.current.remove(first.id));
    expect(result.current.files).toEqual([second]);
    act(() => result.current.clear());
    expect(result.current.files).toEqual([]);
  });
});
