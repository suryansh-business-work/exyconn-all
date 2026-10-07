// @vitest-environment jsdom
/** The welcome bubble and the details or code form, before a chat section opens. */
import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { SignInFlow } from "../../../../../../src/components/chat-embed/components/sections/SignInFlow";
import type { ChatState } from "../../../../../../src/components/chat-embed/state/state";
import { strings } from "../../../../../../src/components/chat-embed/strings";
import type { Channel } from "../../../../../../src/components/chat-embed/types";
import { renderInChatTheme } from "../../../../test-utils";
import { makeActions, makeConfig, makeState } from "../../chat-fixtures";

function mount(state: ChatState, channel: Channel = "LIVE") {
  const actions = makeActions();
  const view = renderInChatTheme(<SignInFlow state={state} actions={actions} channel={channel} />);
  return { ...view, actions };
}

const IDENTITY = { name: "Riya", email: "riya@example.com", phone: "" };

describe("SignInFlow", () => {
  it("greets the visitor with the team's welcome above the details form", () => {
    mount(makeState({ config: makeConfig({ welcomeMessage: "Namaste!" }) }));
    expect(screen.getByText("Namaste!")).toBeInTheDocument();
    expect(screen.queryByText("We are away right now.")).not.toBeInTheDocument();
    expect(screen.getByRole("form", { name: strings.signInTitle })).toBeInTheDocument();
  });

  it("adds the offline message when the team is away", () => {
    mount(makeState({ config: makeConfig({ online: false, welcomeMessage: "Namaste!" }) }));
    expect(screen.getByText("Namaste!")).toBeInTheDocument();
    expect(screen.getByText("We are away right now.")).toBeInTheDocument();
  });

  it("shows only the offline message when there is no welcome", () => {
    mount(makeState({ config: makeConfig({ online: false, welcomeMessage: "" }) }));
    expect(screen.getByText("We are away right now.")).toBeInTheDocument();
  });

  it("introduces the Knowledge Bot, whatever the team's hours", () => {
    mount(makeState({ config: makeConfig({ online: false }) }), "KNOWLEDGE");
    expect(screen.getByText(strings.knowledgeIntro)).toBeInTheDocument();
    expect(screen.queryByText("We are away right now.")).not.toBeInTheDocument();
  });

  it("shows no bubble before the config arrives", () => {
    mount(makeState());
    expect(screen.queryByText("Hello! How can we help?")).not.toBeInTheDocument();
    expect(screen.getByRole("form", { name: strings.signInTitle })).toBeInTheDocument();
  });

  it("asks for a code with the details typed", async () => {
    const { user, actions } = mount(makeState({ config: makeConfig() }));
    await user.type(screen.getByRole("textbox", { name: /^Name/ }), IDENTITY.name);
    await user.type(screen.getByRole("textbox", { name: /^Email/ }), IDENTITY.email);
    await user.click(screen.getByRole("button", { name: strings.requestCode }));
    expect(actions.requestCode).toHaveBeenCalledWith(IDENTITY);
  });

  it("swaps to the code form, without the welcome, once a code was sent", async () => {
    const state = makeState({
      config: makeConfig({ welcomeMessage: "Namaste!" }),
      step: "code",
      identity: IDENTITY,
      codeSentAt: Date.now() - 60_000,
    });
    const { user, actions } = mount(state);
    expect(screen.queryByText("Namaste!")).not.toBeInTheDocument();
    expect(screen.getByText(strings.codeSentTo(IDENTITY.email))).toBeInTheDocument();
    await user.type(screen.getByRole("textbox", { name: new RegExp(strings.code) }), "654321");
    await user.click(screen.getByRole("button", { name: strings.verify }));
    expect(actions.verifyCode).toHaveBeenCalledWith("654321");
    await user.click(screen.getByRole("button", { name: strings.resend }));
    expect(actions.resendCode).toHaveBeenCalledTimes(1);
    await user.click(screen.getByRole("button", { name: strings.changeEmail }));
    expect(actions.changeEmail).toHaveBeenCalledTimes(1);
  });
});
