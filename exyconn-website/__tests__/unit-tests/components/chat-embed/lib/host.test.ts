/** The postMessage bridge between the chat iframe and the loader on the embedding page. */
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  isEmbedded,
  postToHost,
  readHostMessage,
  referrerOrigin,
} from "../../../../../src/components/chat-embed/lib/host";

const HOST = "https://shop.example.com";

/** Makes the chat look like it runs inside an iframe whose parent records what it is sent. */
function embed() {
  const parent = { postMessage: vi.fn() };
  vi.stubGlobal("window", globalThis);
  vi.stubGlobal("parent", parent);
  return parent;
}

function standalone(): void {
  vi.stubGlobal("window", globalThis);
  vi.stubGlobal("parent", globalThis);
}

function page(ancestorOrigins: string[] | undefined, referrer: string): void {
  vi.stubGlobal("location", { ancestorOrigins });
  vi.stubGlobal("document", { referrer });
}

const fromHost = (data: unknown, source: unknown) => ({ data, source }) as unknown as MessageEvent;

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("isEmbedded", () => {
  it("is true inside an iframe and false when opened on its own", () => {
    embed();
    expect(isEmbedded()).toBe(true);
    standalone();
    expect(isEmbedded()).toBe(false);
  });
});

describe("referrerOrigin", () => {
  it("prefers the browser's ancestor origins", () => {
    page([HOST], "https://other.example.org/page");
    expect(referrerOrigin()).toBe(HOST);
  });

  it("falls back to the referrer's origin", () => {
    page(undefined, `${HOST}/products/42?ref=chat`);
    expect(referrerOrigin()).toBe(HOST);
    page([], `${HOST}/cart`);
    expect(referrerOrigin()).toBe(HOST);
  });

  it("is empty with no referrer or one that is not a URL", () => {
    page(undefined, "");
    expect(referrerOrigin()).toBe("");
    page(undefined, "not a url");
    expect(referrerOrigin()).toBe("");
  });
});

describe("postToHost", () => {
  it("posts a namespaced message to the loader's origin", () => {
    const parent = embed();
    postToHost({ type: "resize", state: "open" }, HOST);
    expect(parent.postMessage).toHaveBeenCalledWith(
      { source: "exy-chat", type: "resize", state: "open" },
      HOST
    );
  });

  it("does nothing when the origin is unknown", () => {
    const parent = embed();
    postToHost({ type: "ready" }, "");
    expect(parent.postMessage).not.toHaveBeenCalled();
  });

  it("does nothing when nothing embeds the chat", () => {
    standalone();
    const postMessage = vi.fn();
    vi.stubGlobal("postMessage", postMessage);
    postToHost({ type: "unread", count: 2 }, HOST);
    expect(postMessage).not.toHaveBeenCalled();
  });
});

describe("readHostMessage", () => {
  it("reads the page, theme and layout messages from the loader", () => {
    const parent = embed();
    const read = (data: unknown) => readHostMessage(fromHost(data, parent));
    expect(read({ source: "exy-chat-host", type: "page", url: `${HOST}/a` })).toEqual({
      type: "page",
      url: `${HOST}/a`,
    });
    expect(read({ source: "exy-chat-host", type: "theme", theme: "dark" })).toEqual({
      type: "theme",
      theme: "dark",
    });
    expect(read({ source: "exy-chat-host", type: "theme", theme: "light" })).toEqual({
      type: "theme",
      theme: "light",
    });
    expect(read({ source: "exy-chat-host", type: "layout", compact: false })).toEqual({
      type: "layout",
      compact: false,
    });
  });

  it("ignores messages from other frames or scripts", () => {
    const parent = embed();
    const message = { source: "exy-chat-host", type: "page", url: HOST };
    expect(readHostMessage(fromHost(message, { other: true }))).toBeNull();
    expect(readHostMessage(fromHost("page", parent))).toBeNull();
    expect(readHostMessage(fromHost(null, parent))).toBeNull();
    expect(readHostMessage(fromHost({ ...message, source: "someone-else" }, parent))).toBeNull();
  });

  it("ignores malformed or unknown loader messages", () => {
    const parent = embed();
    const read = (data: object) =>
      readHostMessage(fromHost({ source: "exy-chat-host", ...data }, parent));
    expect(read({ type: "page", url: 42 })).toBeNull();
    expect(read({ type: "theme", theme: "sepia" })).toBeNull();
    expect(read({ type: "layout", compact: "yes" })).toBeNull();
    expect(read({ type: "shutdown" })).toBeNull();
  });
});
