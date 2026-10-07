// @vitest-environment jsdom
/** A chat section: sign-in until there is a session, then its thread and its own composer. */
import { screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ChatSection } from "../../../../../../src/components/chat-embed/components/sections/ChatSection";
import type { ChatState } from "../../../../../../src/components/chat-embed/state/state";
import { strings } from "../../../../../../src/components/chat-embed/strings";
import type { Channel } from "../../../../../../src/components/chat-embed/types";
import { renderInChatTheme } from "../../../../test-utils";
import {
  makeActions,
  makeConfig,
  makeSession,
  makeState,
  signedInState,
} from "../../chat-fixtures";

function mount(state: ChatState, channel: Channel = "LIVE") {
  const actions = makeActions();
  const view = renderInChatTheme(
    <ChatSection channel={channel} state={state} actions={actions} active onTab={vi.fn()} />
  );
  return { ...view, actions };
}

describe("ChatSection", () => {
  it("asks the visitor to sign in first", () => {
    mount(makeState({ config: makeConfig() }));
    expect(screen.getByRole("form", { name: strings.signInTitle })).toBeInTheDocument();
    expect(screen.queryByRole("log")).not.toBeInTheDocument();
  });

  it("keeps the sign-in until a session arrives with the signed-in step", () => {
    mount(makeState({ step: "signedIn", session: null }));
    expect(screen.getByRole("form", { name: strings.signInTitle })).toBeInTheDocument();
  });

  it("shows the live thread with a composer that takes uploads when allowed", () => {
    mount(signedInState({ config: makeConfig({ allowUploads: true }) }));
    expect(
      screen.getByRole("log", { name: strings.conversation(strings.tabLive) })
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: strings.attach })).toBeInTheDocument();
  });

  it("gives the live composer no uploads when the settings refuse them", () => {
    mount(signedInState({ config: makeConfig({ allowUploads: false }) }));
    expect(screen.queryByRole("button", { name: strings.attach })).not.toBeInTheDocument();
  });

  it("never offers uploads to the Knowledge Bot, nor before the config arrives", () => {
    const bot = mount(signedInState(), "KNOWLEDGE");
    expect(
      screen.getByRole("log", { name: strings.conversation(strings.tabKnowledge) })
    ).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: strings.attach })).not.toBeInTheDocument();
    bot.unmount();
    mount(signedInState({ config: null }));
    expect(screen.queryByRole("button", { name: strings.attach })).not.toBeInTheDocument();
    expect(
      screen.getByRole("textbox", { name: strings.messageLabel(strings.tabLive) })
    ).toBeInTheDocument();
  });

  it("offers a new chat and the transcript once the chat has ended", async () => {
    const { user, actions } = mount(signedInState({ session: makeSession({ status: "CLOSED" }) }));
    expect(screen.getByText(strings.ended)).toBeInTheDocument();
    expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: strings.newChat }));
    await user.click(screen.getByRole("button", { name: strings.download }));
    expect(actions.newChat).toHaveBeenCalledTimes(1);
    expect(actions.download).toHaveBeenCalledTimes(1);
  });
});
