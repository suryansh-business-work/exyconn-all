// @vitest-environment jsdom
/** The open chat section, kept as a `?tab=` slug in the iframe's URL. */
import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import { useTabParam } from "../../../../../src/components/chat-embed/hooks/useTabParam";

function visit(path: string) {
  globalThis.history.replaceState(null, "", path);
}

beforeEach(() => {
  visit("/embed/chat");
});

describe("useTabParam", () => {
  it("opens on the live chat when the URL names no section", () => {
    const { result } = renderHook(() => useTabParam());
    expect(result.current[0]).toBe("LIVE");
  });

  it("opens on the section the URL names", () => {
    visit("/embed/chat?site=WEBSITE&tab=faqs");
    const { result } = renderHook(() => useTabParam());
    expect(result.current[0]).toBe("FAQS");
  });

  it("falls back to the live chat for an unknown slug", () => {
    visit("/embed/chat?tab=settings");
    const { result } = renderHook(() => useTabParam());
    expect(result.current[0]).toBe("LIVE");
  });

  it("switches sections in place, keeping the other query parameters and the history", () => {
    visit("/embed/chat?site=WEBSITE");
    const before = globalThis.history.length;
    const { result } = renderHook(() => useTabParam());
    act(() => result.current[1]("KNOWLEDGE"));
    expect(result.current[0]).toBe("KNOWLEDGE");
    const url = new URL(globalThis.location.href);
    expect(url.searchParams.get("tab")).toBe("knowledge");
    expect(url.searchParams.get("site")).toBe("WEBSITE");
    expect(globalThis.history.length).toBe(before);
  });
});
