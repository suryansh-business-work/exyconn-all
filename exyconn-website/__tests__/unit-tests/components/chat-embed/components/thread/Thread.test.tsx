// @vitest-environment jsdom
/** One thread: intro, day separators, messages, typing, and the "New messages" chip. */
import { fireEvent, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { Thread } from "../../../../../../src/components/chat-embed/components/thread/Thread";
import type { ThreadItem } from "../../../../../../src/components/chat-embed/state/state";
import { strings } from "../../../../../../src/components/chat-embed/strings";
import type { Channel } from "../../../../../../src/components/chat-embed/types";
import { renderInChatTheme } from "../../../../test-utils";
import { makeActions, makeConfig, makeItem, makeSession } from "../../chat-fixtures";

interface Options {
  typing?: string;
  agentName?: string;
}

function view(
  channel: Channel,
  items: readonly ThreadItem[],
  actions = makeActions(),
  options: Options = {}
) {
  const onTab = vi.fn();
  const ui = (
    <Thread
      channel={channel}
      items={items}
      typing={options.typing ?? ""}
      config={makeConfig({ faqs: [{ id: "f1", question: "Who are you?", answer: "Exyconn." }] })}
      session={makeSession({ agentName: options.agentName ?? "" })}
      visible
      actions={actions}
      onTab={onTab}
    />
  );
  return { ui, onTab, actions };
}

function mount(channel: Channel, items: readonly ThreadItem[], options: Options = {}) {
  const built = view(channel, items, makeActions(), options);
  return { ...renderInChatTheme(built.ui), ...built };
}

const visitor = (id: string, extra: Partial<ThreadItem["message"]> = {}) =>
  makeItem({ id, body: `Message ${id}`, ...extra });

describe("Thread", () => {
  it("welcomes an empty live thread with the team's intro and notices", () => {
    mount("LIVE", [], { agentName: "Ana" });
    expect(
      screen.getByRole("log", { name: strings.conversation(strings.tabLive) })
    ).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: strings.liveIntroTitle })).toBeInTheDocument();
    expect(screen.getByText(strings.chattingWith("Ana"))).toBeInTheDocument();
  });

  it("starts an empty Knowledge Bot thread with starters and a way to a person", async () => {
    const { user, actions, onTab } = mount("KNOWLEDGE", []);
    expect(screen.queryByText(strings.chattingWith("Ana"))).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Who are you?" }));
    expect(actions.send).toHaveBeenCalledWith("KNOWLEDGE", "Who are you?", []);
    await user.click(screen.getByRole("button", { name: strings.talkToPerson }));
    expect(onTab).toHaveBeenCalledWith("LIVE");
  });

  it("lists the messages under today's separator, with Seen on the last read one", () => {
    const read = "2026-10-07T09:00:00.000Z";
    mount("LIVE", [visitor("v1", { readAt: read }), visitor("v2", { readAt: read })]);
    expect(screen.queryByRole("heading", { name: strings.liveIntroTitle })).not.toBeInTheDocument();
    expect(screen.getByText(strings.today)).toBeInTheDocument();
    expect(screen.getByText("Message v1")).toBeInTheDocument();
    expect(screen.getAllByText(new RegExp(` · ${strings.seen}$`))).toHaveLength(1);
  });

  it("never marks Knowledge Bot messages as seen", () => {
    mount("KNOWLEDGE", [
      visitor("v1", { channel: "KNOWLEDGE", readAt: "2026-10-07T09:00:00.000Z" }),
    ]);
    expect(screen.queryByText(new RegExp(strings.seen))).not.toBeInTheDocument();
  });

  it("shows who is typing", () => {
    mount("LIVE", [visitor("v1")], { typing: "Ana" });
    expect(screen.getByText(strings.typing("Ana"))).toBeInTheDocument();
  });

  it("retries, dismisses and rates on this thread's channel", async () => {
    const failed = makeItem({ id: "c-1", body: "Lost" }, { status: "failed" });
    const bot = makeItem({
      id: "b-1",
      channel: "KNOWLEDGE",
      sender: "BOT",
      senderName: "Exy",
      body: "Answer",
    });
    const { user, actions } = mount("KNOWLEDGE", [failed, bot]);
    await user.click(screen.getByRole("button", { name: strings.retry }));
    await user.click(screen.getByRole("button", { name: strings.dismiss }));
    await user.click(screen.getByRole("button", { name: strings.helpful }));
    expect(actions.retry).toHaveBeenCalledWith("KNOWLEDGE", "c-1");
    expect(actions.discard).toHaveBeenCalledWith("KNOWLEDGE", "c-1");
    expect(actions.rate).toHaveBeenCalledWith("b-1", true);
  });

  it("offers a New messages chip after the visitor scrolls up, and jumps back from it", async () => {
    const actions = makeActions();
    const first = view("LIVE", [visitor("v1")], actions);
    const { user, rerender } = renderInChatTheme(first.ui);
    // Hidden by its Fade until there is something new, so look it up among hidden nodes too.
    const chip = screen.getByRole("button", { name: strings.newMessages, hidden: true });
    expect(chip).not.toBeVisible();
    const log = screen.getByRole("log");
    Object.defineProperty(log, "scrollHeight", { value: 1000, configurable: true });
    Object.defineProperty(log, "clientHeight", { value: 300, configurable: true });
    fireEvent.scroll(log);
    rerender(view("LIVE", [visitor("v1"), visitor("v2")], actions).ui);
    await waitFor(() => expect(chip).toBeVisible());
    await user.click(chip);
    await waitFor(() => expect(chip).not.toBeVisible());
  });
});
