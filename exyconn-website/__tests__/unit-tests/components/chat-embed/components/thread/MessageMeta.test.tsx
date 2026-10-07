// @vitest-environment jsdom
/** Under a bubble: its time, Sending…, Seen, or Not sent with Retry and Dismiss. */
import { screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { MessageMeta } from "../../../../../../src/components/chat-embed/components/thread/MessageMeta";
import { formatTime } from "../../../../../../src/components/chat-embed/lib/time";
import type { ThreadItem } from "../../../../../../src/components/chat-embed/state/state";
import { strings } from "../../../../../../src/components/chat-embed/strings";
import { renderInChatTheme } from "../../../../test-utils";
import { makeItem } from "../../chat-fixtures";

const CREATED = "2026-10-07T09:30:00.000Z";
/** Intl may put a narrow no-break space before AM/PM; Testing Library reads it as a space. */
const time = () => formatTime(CREATED).replaceAll(/\s+/g, " ");

function mount(item: ThreadItem, show = true, seen = false) {
  const onRetry = vi.fn();
  const onDiscard = vi.fn();
  const view = renderInChatTheme(
    <MessageMeta item={item} show={show} seen={seen} onRetry={onRetry} onDiscard={onDiscard} />
  );
  return { ...view, onRetry, onDiscard };
}

describe("MessageMeta", () => {
  it("offers retry and dismiss on a message that was not sent", async () => {
    const { user, onRetry, onDiscard } = mount(makeItem({ id: "c-1" }, { status: "failed" }));
    expect(screen.getByRole("alert")).toHaveTextContent(strings.failed);
    await user.click(screen.getByRole("button", { name: strings.retry }));
    await user.click(screen.getByRole("button", { name: strings.dismiss }));
    expect(onRetry).toHaveBeenCalledWith("c-1");
    expect(onDiscard).toHaveBeenCalledWith("c-1");
  });

  it("says why the server refused a message", () => {
    mount(makeItem({}, { status: "failed", error: "That file is too large." }), false);
    expect(screen.getByRole("alert")).toHaveTextContent("That file is too large.");
  });

  it("renders nothing inside a group that is neither last nor seen", () => {
    const { container } = mount(makeItem(), false, false);
    expect(container).toBeEmptyDOMElement();
  });

  it("shows Sending… while the message is on its way", () => {
    mount(makeItem({}, { status: "sending" }));
    expect(screen.getByText(strings.sending)).toBeInTheDocument();
  });

  it("shows the time under the last bubble, and Seen once the team read it", () => {
    const item = makeItem({ createdAt: CREATED });
    const { rerender } = mount(item);
    expect(screen.getByText(time())).toBeInTheDocument();
    rerender(<MessageMeta item={item} show={false} seen onRetry={vi.fn()} onDiscard={vi.fn()} />);
    expect(screen.getByText(`${time()} · ${strings.seen}`)).toBeInTheDocument();
  });
});
