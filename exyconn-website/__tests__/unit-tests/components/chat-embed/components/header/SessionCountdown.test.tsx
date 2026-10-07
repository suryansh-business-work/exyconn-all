// @vitest-environment jsdom
/** "Chat ends in 9:41 without a reply", announced only at the two-minute, one-minute and 30 s marks. */
import { screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { SessionCountdown } from "../../../../../../src/components/chat-embed/components/header/SessionCountdown";
import { useCountdown } from "../../../../../../src/components/chat-embed/hooks/useCountdown";
import { strings } from "../../../../../../src/components/chat-embed/strings";
import { renderInChatTheme } from "../../../../test-utils";

vi.mock("../../../../../../src/components/chat-embed/hooks/useCountdown", () => ({
  useCountdown: vi.fn(),
}));

const EXPIRES = "2026-10-07T10:10:00.000Z";

/** Renders with `seconds` left, and re-renders through each later value. */
function countFrom(seconds: number) {
  vi.mocked(useCountdown).mockReturnValue(seconds);
  const view = renderInChatTheme(<SessionCountdown expiresAt={EXPIRES} />);
  const tick = (next: number) => {
    vi.mocked(useCountdown).mockReturnValue(next);
    view.rerender(<SessionCountdown expiresAt={EXPIRES} />);
  };
  return { ...view, tick };
}

const announcement = () => screen.getByRole("status").textContent;

beforeEach(() => {
  vi.mocked(useCountdown).mockReset();
});

describe("SessionCountdown", () => {
  it("renders nothing when the chat does not time out", () => {
    vi.mocked(useCountdown).mockReturnValue(null);
    const { container } = renderInChatTheme(<SessionCountdown expiresAt={null} />);
    expect(container).toBeEmptyDOMElement();
    expect(useCountdown).toHaveBeenCalledWith(null);
  });

  it("shows the time left without announcing it", () => {
    countFrom(581);
    expect(screen.getByText(strings.endsIn("9:41"))).toBeInTheDocument();
    expect(useCountdown).toHaveBeenCalledWith(EXPIRES);
    expect(announcement()).toBe("");
  });

  it("announces the two-minute, one-minute and 30-second marks once each", () => {
    const { tick } = countFrom(125);
    expect(announcement()).toBe("");
    tick(120);
    expect(screen.getByText(strings.endsIn("2:00"))).toBeInTheDocument();
    expect(announcement()).toBe(strings.endsSoon(2));
    tick(100);
    expect(announcement()).toBe(strings.endsSoon(2));
    tick(60);
    expect(announcement()).toBe(strings.endsSoon(1));
    tick(30);
    expect(announcement()).toBe("This chat ends in under a minute without a reply.");
  });

  it("announces again after a reply pushes the deadline back", () => {
    const { tick } = countFrom(120);
    tick(60);
    expect(announcement()).toBe(strings.endsSoon(1));
    tick(600);
    expect(screen.getByText(strings.endsIn("10:00"))).toBeInTheDocument();
    tick(119);
    expect(announcement()).toBe(strings.endsSoon(2));
  });
});
