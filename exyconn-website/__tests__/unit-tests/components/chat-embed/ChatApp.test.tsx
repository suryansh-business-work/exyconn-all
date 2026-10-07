// @vitest-environment jsdom
/** The /embed/chat island: theme, brand mark and reduced motion around the chat widget. */
import { render, screen } from "@testing-library/react";
import { useColorScheme, useTheme } from "@mui/material/styles";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useBrandMark } from "../../../../src/components/chat-embed/lib/brand";

const mocks = vi.hoisted(() => ({
  reducedMotion: false,
  postToHost: vi.fn(),
  referrerOrigin: vi.fn(() => "https://host.example"),
}));

vi.mock("@mui/material/useMediaQuery", () => ({
  default: (query: string) => query === "(prefers-reduced-motion: reduce)" && mocks.reducedMotion,
}));

vi.mock("../../../../src/components/chat-embed/lib/host", () => ({
  postToHost: mocks.postToHost,
  referrerOrigin: mocks.referrerOrigin,
}));

/** Stands in for the widget, showing what ChatApp handed it and the context around it. */
function FakeWidget({
  socketUrl,
  site,
  reducedMotion,
}: Readonly<{ socketUrl: string; site: string; reducedMotion: boolean }>) {
  const brandMark = useBrandMark();
  const theme = useTheme();
  const { mode } = useColorScheme();
  return (
    <dl>
      <dt>socket</dt>
      <dd>{socketUrl}</dd>
      <dt>site</dt>
      <dd>{site}</dd>
      <dt>motion</dt>
      <dd>{reducedMotion ? "reduced" : "full"}</dd>
      <dt>brand</dt>
      <dd>{brandMark}</dd>
      <dt>mode</dt>
      <dd>{mode}</dd>
      <dt>duration</dt>
      <dd>{theme.transitions.duration.standard}</dd>
    </dl>
  );
}

vi.mock("../../../../src/components/chat-embed/components/ChatWidget", () => ({
  ChatWidget: FakeWidget,
}));

import ChatApp from "../../../../src/components/chat-embed/ChatApp";

const PROPS = {
  socketUrl: "wss://portal.example/chat/ws",
  site: "WEBSITE",
  theme: "dark",
  brandMark: "/brand/mark.svg",
} as const;

const shown = (term: string) => screen.getByText(term).nextElementSibling?.textContent;

beforeEach(() => {
  mocks.reducedMotion = false;
  vi.clearAllMocks();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("ChatApp", () => {
  it("mounts the widget with the socket, site, brand mark and host mode", () => {
    render(<ChatApp {...PROPS} />);
    expect(shown("socket")).toBe(PROPS.socketUrl);
    expect(shown("site")).toBe("WEBSITE");
    expect(shown("brand")).toBe("/brand/mark.svg");
    expect(shown("mode")).toBe("dark");
    expect(shown("motion")).toBe("full");
    expect(Number(shown("duration"))).toBeGreaterThan(0);
    expect(mocks.postToHost).not.toHaveBeenCalled();
  });

  it("drops motion from the theme and the widget when the visitor prefers less", () => {
    mocks.reducedMotion = true;
    render(<ChatApp {...PROPS} theme="light" />);
    expect(shown("motion")).toBe("reduced");
    expect(shown("duration")).toBe("0");
    expect(shown("mode")).toBe("light");
  });

  it("makes the page itself transparent and unscrollable inside the iframe", () => {
    render(<ChatApp {...PROPS} />);
    const css = Array.from(document.querySelectorAll("style"))
      .map((style) => style.textContent ?? "")
      .join("\n");
    expect(css).toMatch(/html,\s*body\s*\{[^}]*overflow:\s*hidden/);
    expect(css).toMatch(/background:\s*transparent/);
  });

  it("shows nothing and asks the loader to hide the iframe when no socket is configured", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
    render(<ChatApp {...PROPS} socketUrl="" />);
    expect(screen.queryByText("socket")).not.toBeInTheDocument();
    expect(warn).toHaveBeenCalledWith(
      "[chat] PUBLIC_PORTAL_GRAPHQL_URL is not set; the chat is not shown."
    );
    expect(mocks.postToHost).toHaveBeenCalledWith(
      { type: "resize", state: "hidden" },
      "https://host.example"
    );
  });
});
