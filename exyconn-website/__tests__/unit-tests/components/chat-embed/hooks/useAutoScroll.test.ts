// @vitest-environment jsdom
/** Keeping a thread on its newest message, or offering a "New messages" chip. */
import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { useAutoScroll } from "../../../../../src/components/chat-embed/hooks/useAutoScroll";

interface Metrics {
  scrollHeight: number;
  scrollTop: number;
  clientHeight: number;
}

/** A scroller whose sizes jsdom would otherwise report as 0. */
function scroller(metrics: Metrics): HTMLDivElement {
  const el = document.createElement("div");
  Object.defineProperty(el, "scrollHeight", { value: metrics.scrollHeight, configurable: true });
  Object.defineProperty(el, "clientHeight", { value: metrics.clientHeight, configurable: true });
  Object.defineProperty(el, "scrollTop", {
    value: metrics.scrollTop,
    writable: true,
    configurable: true,
  });
  return el;
}

function mount(count: number, visible = true) {
  return renderHook(
    (props: { count: number; visible: boolean }) => useAutoScroll(props.count, props.visible),
    { initialProps: { count, visible } }
  );
}

describe("useAutoScroll", () => {
  it("follows new messages while the visitor is at the bottom", () => {
    const view = mount(1);
    const el = scroller({ scrollHeight: 900, scrollTop: 0, clientHeight: 300 });
    view.result.current.ref.current = el;
    view.rerender({ count: 2, visible: true });
    expect(el.scrollTop).toBe(900);
    expect(view.result.current.hasNew).toBe(false);
  });

  it("leaves a hidden thread alone", () => {
    const view = mount(1, false);
    const el = scroller({ scrollHeight: 900, scrollTop: 0, clientHeight: 300 });
    view.result.current.ref.current = el;
    view.rerender({ count: 2, visible: false });
    expect(el.scrollTop).toBe(0);
    expect(view.result.current.hasNew).toBe(false);
  });

  it("asks for the chip instead of scrolling once the visitor has scrolled up", () => {
    const view = mount(1);
    const el = scroller({ scrollHeight: 1000, scrollTop: 100, clientHeight: 300 });
    view.result.current.ref.current = el;
    act(() => view.result.current.onScroll());
    view.rerender({ count: 2, visible: true });
    expect(el.scrollTop).toBe(100);
    expect(view.result.current.hasNew).toBe(true);
  });

  it("does not raise the chip when the visitor scrolled up but nothing new arrived", () => {
    const view = mount(3);
    const el = scroller({ scrollHeight: 1000, scrollTop: 100, clientHeight: 300 });
    view.result.current.ref.current = el;
    act(() => view.result.current.onScroll());
    view.rerender({ count: 3, visible: false });
    view.rerender({ count: 3, visible: true });
    expect(view.result.current.hasNew).toBe(false);
  });

  it("drops the chip when the visitor scrolls back near the bottom", () => {
    const view = mount(1);
    const el = scroller({ scrollHeight: 1000, scrollTop: 100, clientHeight: 300 });
    view.result.current.ref.current = el;
    act(() => view.result.current.onScroll());
    view.rerender({ count: 2, visible: true });
    expect(view.result.current.hasNew).toBe(true);
    el.scrollTop = 660;
    act(() => view.result.current.onScroll());
    expect(view.result.current.hasNew).toBe(false);
  });

  it("jumps to the newest message from the chip", () => {
    const view = mount(1);
    const el = scroller({ scrollHeight: 1000, scrollTop: 0, clientHeight: 300 });
    view.result.current.ref.current = el;
    act(() => view.result.current.onScroll());
    view.rerender({ count: 2, visible: true });
    act(() => view.result.current.scrollToBottom());
    expect(el.scrollTop).toBe(1000);
    expect(view.result.current.hasNew).toBe(false);
    view.rerender({ count: 3, visible: true });
    expect(view.result.current.hasNew).toBe(false);
  });

  it("ignores scroll events and jumps before the thread has mounted", () => {
    const view = mount(1);
    act(() => view.result.current.onScroll());
    act(() => view.result.current.scrollToBottom());
    expect(view.result.current.ref.current).toBeNull();
    expect(view.result.current.hasNew).toBe(false);
  });
});
