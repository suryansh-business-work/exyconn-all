// @vitest-environment jsdom
/** The brand mark the chat's avatars show, provided once by the app. */
import type { ReactNode } from "react";
import { renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { BrandMarkContext, useBrandMark } from "../../../../../src/components/chat-embed/lib/brand";

const MARK = "https://cdn.example.com/favicon.svg";

function Provider({ children }: Readonly<{ children: ReactNode }>) {
  return <BrandMarkContext value={MARK}>{children}</BrandMarkContext>;
}

describe("useBrandMark", () => {
  it("reads the mark the app provides", () => {
    const { result } = renderHook(() => useBrandMark(), { wrapper: Provider });
    expect(result.current).toBe(MARK);
  });

  it("is empty outside a provider", () => {
    const { result } = renderHook(() => useBrandMark());
    expect(result.current).toBe("");
  });
});
