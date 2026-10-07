// @vitest-environment jsdom
/** The chat's attachment helpers: kinds, size limits, data URLs and the links it will open. */
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  MAX_FILES,
  isSafeUrl,
  isTooBig,
  kindOf,
  previewOf,
  readDataUrl,
  withoutTypeParams,
} from "../../../../../src/components/chat-embed/lib/files";

/** A FileReader that always fails, with or without the browser's own error. */
function failingReader(error: DOMException | null) {
  return class {
    readonly error = error;
    readonly result = null;
    private onError: () => void = () => undefined;
    addEventListener(type: string, listener: () => void): void {
      if (type === "error") {
        this.onError = listener;
      }
    }
    readAsDataURL(): void {
      queueMicrotask(() => this.onError());
    }
  };
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("kindOf", () => {
  it("maps pictures, clips and voice notes to their attachment kind", () => {
    expect(kindOf("image/png")).toBe("IMAGE");
    expect(kindOf("video/mp4")).toBe("VIDEO");
    expect(kindOf("audio/webm;codecs=opus")).toBe("AUDIO");
  });

  it("refuses anything the chat cannot carry", () => {
    expect(kindOf("application/pdf")).toBeNull();
    expect(kindOf("")).toBeNull();
  });
});

describe("isTooBig", () => {
  it("allows a file exactly at the limit and refuses one byte over", () => {
    const limit = 2 * 1024 * 1024;
    expect(isTooBig(limit, 2)).toBe(false);
    expect(isTooBig(limit + 1, 2)).toBe(true);
    expect(isTooBig(0, 0)).toBe(false);
  });

  it("matches the server's file count", () => {
    expect(MAX_FILES).toBe(4);
  });
});

describe("withoutTypeParams", () => {
  it("re-wraps the bytes under the bare MIME type", () => {
    const blob = new Blob(["voice"], { type: "audio/webm;codecs=opus" });
    const bare = withoutTypeParams(blob);
    expect(bare.type).toBe("audio/webm");
    expect(bare.size).toBe(blob.size);
  });

  it("leaves a type without parameters as it is", () => {
    expect(withoutTypeParams(new Blob(["x"], { type: "image/png" })).type).toBe("image/png");
  });
});

describe("readDataUrl", () => {
  it("reads a blob as a data URL", async () => {
    await expect(readDataUrl(new Blob(["abc"], { type: "text/plain" }))).resolves.toBe(
      "data:text/plain;base64,YWJj"
    );
  });

  it("rejects with the reader's own error", async () => {
    const error = new DOMException("blocked", "NotReadableError");
    vi.stubGlobal("FileReader", failingReader(error));
    await expect(readDataUrl(new Blob(["x"]))).rejects.toBe(error);
  });

  it("rejects with a generic error when the reader gives none", async () => {
    vi.stubGlobal("FileReader", failingReader(null));
    await expect(readDataUrl(new Blob(["x"]))).rejects.toThrow("read failed");
  });
});

describe("previewOf", () => {
  it("shows an outgoing file under the kind its data URL declares", () => {
    expect(previewOf({ name: "note.ogg", data: "data:audio/ogg;base64,AAAA" })).toEqual({
      url: "data:audio/ogg;base64,AAAA",
      name: "note.ogg",
      kind: "AUDIO",
      size: 0,
    });
    expect(previewOf({ name: "clip.mp4", data: "data:video/mp4;base64,AAAA" }).kind).toBe("VIDEO");
  });

  it("falls back to a picture for a type the chat does not know", () => {
    expect(previewOf({ name: "doc.pdf", data: "data:application/pdf;base64,AAAA" }).kind).toBe(
      "IMAGE"
    );
  });
});

describe("isSafeUrl", () => {
  it("accepts web links and the chat's own previews", () => {
    expect(isSafeUrl("https://media.example.com/a.png")).toBe(true);
    expect(isSafeUrl("http://media.example.com/a.png")).toBe(true);
    expect(isSafeUrl("data:image/png;base64,AAAA")).toBe(true);
  });

  it("refuses script and relative links", () => {
    expect(isSafeUrl("javascript:alert(1)")).toBe(false);
    expect(isSafeUrl("/uploads/a.png")).toBe(false);
    expect(isSafeUrl("")).toBe(false);
  });
});
