// @vitest-environment jsdom
/** The round corner button that opens the chat, with its unread badge and nudge. */
import { createRef } from "react";
import { act, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { Launcher } from "../../../../../src/components/chat-embed/components/Launcher";
import { strings } from "../../../../../src/components/chat-embed/strings";
import { renderInChatTheme } from "../../../test-utils";

const NUDGE_MS = 900;

function mount(props: Partial<{ unread: number; nudges: number; reducedMotion: boolean }> = {}) {
  const onOpen = vi.fn();
  const ref = createRef<HTMLButtonElement>();
  const view = renderInChatTheme(
    <Launcher ref={ref} unread={0} nudges={0} reducedMotion onOpen={onOpen} {...props} />
  );
  return { ...view, onOpen, ref };
}

/** The nudge's reset timer, among whatever else scheduled a timeout. */
function nudgeTimer(calls: ReadonlyArray<readonly unknown[]>) {
  return calls.find(([, delay]) => delay === NUDGE_MS);
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe("Launcher", () => {
  it("opens the chat and forwards its ref to the button", async () => {
    const { user, onOpen, ref } = mount();
    const button = screen.getByRole("button", { name: strings.openChat });
    expect(ref.current).toBe(button);
    expect(button).toHaveAttribute("title", strings.openChat);
    await user.click(button);
    expect(onOpen).toHaveBeenCalledTimes(1);
  });

  it("names a single unread message", () => {
    mount({ unread: 1 });
    expect(
      screen.getByRole("button", { name: `${strings.openChat}, ${strings.unread(1)}` })
    ).toBeInTheDocument();
  });

  it("counts several unread messages on the label and the badge", () => {
    mount({ unread: 3 });
    const button = screen.getByRole("button", { name: "Open chat, 3 unread messages" });
    expect(button).toHaveTextContent("3");
  });

  it("caps the badge at 99+", () => {
    mount({ unread: 150 });
    expect(screen.getByRole("button", { name: /150 unread messages/ })).toHaveTextContent("99+");
  });

  it("plays the nudge once per new reply and settles after it", () => {
    const setTimer = vi.spyOn(globalThis, "setTimeout");
    const clearTimer = vi.spyOn(globalThis, "clearTimeout");
    const { rerender, onOpen } = mount({ reducedMotion: false });
    expect(nudgeTimer(setTimer.mock.calls)).toBeUndefined();
    rerender(<Launcher unread={1} nudges={1} reducedMotion={false} onOpen={onOpen} />);
    const timer = nudgeTimer(setTimer.mock.calls);
    expect(timer).toBeDefined();
    act(() => (timer?.[0] as () => void)());
    rerender(<Launcher unread={2} nudges={2} reducedMotion={false} onOpen={onOpen} />);
    expect(
      (setTimer.mock.calls as ReadonlyArray<readonly unknown[]>).filter(
        ([, delay]) => delay === NUDGE_MS
      )
    ).toHaveLength(2);
    expect(clearTimer).toHaveBeenCalled();
  });

  it("does not nudge with reduced motion", () => {
    const setTimer = vi.spyOn(globalThis, "setTimeout");
    const { rerender, onOpen } = mount({ reducedMotion: true });
    rerender(<Launcher unread={1} nudges={1} reducedMotion onOpen={onOpen} />);
    expect(nudgeTimer(setTimer.mock.calls)).toBeUndefined();
    expect(screen.getByRole("button", { name: /1 unread message/ })).toBeInTheDocument();
  });
});
