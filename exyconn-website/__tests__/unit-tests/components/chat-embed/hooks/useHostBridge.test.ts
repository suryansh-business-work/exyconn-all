// @vitest-environment jsdom
/** The postMessage bridge between the chat iframe and the loader on the host page. */
import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useHostBridge } from "../../../../../src/components/chat-embed/hooks/useHostBridge";
import {
  postToHost,
  readHostMessage,
  referrerOrigin,
  type FrameSize,
  type FromHost,
} from "../../../../../src/components/chat-embed/lib/host";

vi.mock("../../../../../src/components/chat-embed/lib/host", () => ({
  postToHost: vi.fn(),
  readHostMessage: vi.fn(),
  referrerOrigin: vi.fn(),
}));

const REFERRER = "https://host.example.test";
const LOADER = "https://loader.example.test";

interface Props {
  size: FrameSize;
  unread: number;
  onMessage: (message: FromHost) => void;
}

function mount(initial: Partial<Props> = {}) {
  const initialProps: Props = { size: "closed", unread: 0, onMessage: vi.fn(), ...initial };
  return renderHook((props: Props) => useHostBridge(props), { initialProps });
}

function hostSays(message: FromHost | null) {
  vi.mocked(readHostMessage).mockReturnValueOnce(message);
  act(() => {
    globalThis.dispatchEvent(new MessageEvent("message", { data: {}, origin: LOADER }));
  });
}

beforeEach(() => {
  vi.mocked(postToHost).mockReset();
  vi.mocked(readHostMessage).mockReset();
  vi.mocked(referrerOrigin).mockReturnValue(REFERRER);
});

describe("useHostBridge", () => {
  it("says it is ready and reports its size and unread count to the referrer", () => {
    mount({ size: "closed", unread: 2 });
    expect(postToHost).toHaveBeenCalledWith({ type: "ready" }, REFERRER);
    expect(postToHost).toHaveBeenCalledWith({ type: "resize", state: "closed" }, REFERRER);
    expect(postToHost).toHaveBeenCalledWith({ type: "unread", count: 2 }, REFERRER);
  });

  it("reports a new size and a new unread count as they change", () => {
    const view = mount();
    vi.mocked(postToHost).mockClear();
    view.rerender({ size: "open", unread: 0, onMessage: vi.fn() });
    expect(postToHost).toHaveBeenCalledTimes(1);
    expect(postToHost).toHaveBeenCalledWith({ type: "resize", state: "open" }, REFERRER);
    view.rerender({ size: "open", unread: 4, onMessage: vi.fn() });
    expect(postToHost).toHaveBeenLastCalledWith({ type: "unread", count: 4 }, REFERRER);
  });

  it("hands host messages to the latest handler and answers the loader's own origin", () => {
    const first = vi.fn();
    const latest = vi.fn();
    const view = mount({ onMessage: first, size: "open", unread: 1 });
    view.rerender({ size: "open", unread: 1, onMessage: latest });
    vi.mocked(postToHost).mockClear();
    hostSays({ type: "theme", theme: "dark" });
    expect(first).not.toHaveBeenCalled();
    expect(latest).toHaveBeenCalledWith({ type: "theme", theme: "dark" });
    expect(postToHost).toHaveBeenCalledWith({ type: "resize", state: "open" }, LOADER);
    expect(postToHost).toHaveBeenCalledWith({ type: "unread", count: 1 }, LOADER);
  });

  it("ignores messages that are not from the loader", () => {
    const onMessage = vi.fn();
    mount({ onMessage });
    vi.mocked(postToHost).mockClear();
    hostSays(null);
    expect(onMessage).not.toHaveBeenCalled();
    expect(postToHost).not.toHaveBeenCalled();
  });

  it("stops listening when unmounted", () => {
    const onMessage = vi.fn();
    const view = mount({ onMessage });
    view.unmount();
    globalThis.dispatchEvent(new MessageEvent("message", { data: {}, origin: LOADER }));
    expect(readHostMessage).not.toHaveBeenCalled();
    expect(onMessage).not.toHaveBeenCalled();
  });
});
