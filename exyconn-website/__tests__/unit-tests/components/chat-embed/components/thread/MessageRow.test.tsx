// @vitest-environment jsdom
/** One message: a system notice, or a bubble from the visitor, the team or the bot. */
import { screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { MessageRow } from "../../../../../../src/components/chat-embed/components/thread/MessageRow";
import type { ThreadItem } from "../../../../../../src/components/chat-embed/state/state";
import { strings } from "../../../../../../src/components/chat-embed/strings";
import { renderInChatTheme } from "../../../../test-utils";
import { makeItem } from "../../chat-fixtures";

interface Flags {
  first?: boolean;
  last?: boolean;
  seen?: boolean;
  newest?: boolean;
}

function mount(
  item: ThreadItem,
  { first = true, last = true, seen = false, newest = true }: Flags = {}
) {
  const handlers = { onAsk: vi.fn(), onRate: vi.fn(), onRetry: vi.fn(), onDiscard: vi.fn() };
  const view = renderInChatTheme(
    <MessageRow item={item} first={first} last={last} seen={seen} newest={newest} {...handlers} />
  );
  return { ...view, ...handlers };
}

const botAnswer = () =>
  makeItem({
    id: "bot-1",
    channel: "KNOWLEDGE",
    sender: "BOT",
    senderName: "Exy",
    body: "We build AI agents.",
    sources: [{ title: "Services", url: "https://exyconn.example.test/services" }],
    suggestions: ["How long does it take?"],
  });

describe("MessageRow", () => {
  it("shows a system notice as a centred line", () => {
    mount(makeItem({ sender: "SYSTEM", senderName: "", body: "Ana joined the chat" }));
    expect(screen.getByText("Ana joined the chat").tagName).toBe("P");
    expect(screen.queryByText(`${strings.you}:`)).not.toBeInTheDocument();
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it("reads the visitor's own message as theirs", () => {
    mount(makeItem({ body: "Hello" }));
    expect(screen.getByText(`${strings.you}:`)).toBeInTheDocument();
    expect(screen.getByText("Hello")).toBeInTheDocument();
    expect(screen.queryByText("Riya")).not.toBeInTheDocument();
  });

  it("names a team member at the top of a run and draws their initial at the bottom", () => {
    const agent = makeItem({ sender: "AGENT", senderName: "ana", body: "Hi Riya" });
    const { unmount } = mount(agent, { first: true, last: true });
    expect(screen.getByText("ana")).toBeInTheDocument();
    expect(screen.getByText("ana:")).toBeInTheDocument();
    expect(screen.getByText("A")).toBeInTheDocument();
    unmount();
    mount(agent, { first: false, last: false });
    expect(screen.queryByText("ana")).not.toBeInTheDocument();
    expect(screen.queryByText("A")).not.toBeInTheDocument();
  });

  it("adds sources, suggestions and the thumbs to the bot's newest answer", async () => {
    const { user, onAsk, onRate } = mount(botAnswer());
    expect(screen.getByRole("link", { name: "Services" })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "How long does it take?" }));
    expect(onAsk).toHaveBeenCalledWith("How long does it take?");
    await user.click(screen.getByRole("button", { name: strings.helpful }));
    expect(onRate).toHaveBeenCalledWith("bot-1", true);
  });

  it("offers suggestions under the newest answer only", () => {
    mount(botAnswer(), { newest: false });
    expect(screen.queryByRole("group", { name: strings.suggestions })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: strings.notHelpful })).toBeInTheDocument();
  });

  it("frames a picture sent without text", () => {
    const photo = {
      url: "https://media.example.test/p.png",
      name: "p.png",
      kind: "IMAGE" as const,
      size: 1,
    };
    mount(makeItem({ body: "", attachments: [photo] }));
    expect(screen.getByRole("img", { name: "p.png" })).toBeInTheDocument();
  });

  it("shows a failed message with its retry, and Seen on a read one", async () => {
    const failed = makeItem({ id: "c-9", body: "Lost" }, { status: "failed" });
    const view = mount(failed);
    await view.user.click(screen.getByRole("button", { name: strings.retry }));
    expect(view.onRetry).toHaveBeenCalledWith("c-9");
    view.unmount();
    mount(makeItem({ body: "Read" }, { status: "sending" }), { last: false, seen: true });
    expect(
      screen.getByText(new RegExp(`${strings.sending} · ${strings.seen}`))
    ).toBeInTheDocument();
  });
});
