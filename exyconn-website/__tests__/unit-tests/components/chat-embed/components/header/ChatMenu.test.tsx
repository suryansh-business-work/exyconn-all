// @vitest-environment jsdom
/** Sound, download and end chat behind the header's settings menu. */
import { screen, waitFor } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ChatMenu } from "../../../../../../src/components/chat-embed/components/header/ChatMenu";
import type { ChatState } from "../../../../../../src/components/chat-embed/state/state";
import { strings } from "../../../../../../src/components/chat-embed/strings";
import { renderInChatTheme } from "../../../../test-utils";
import { makeActions, makeSession, makeState } from "../../chat-fixtures";

function mount(state: ChatState) {
  const actions = makeActions();
  const view = renderInChatTheme(<ChatMenu state={state} actions={actions} />);
  return { ...view, actions };
}

const settings = () => screen.getByRole("button", { name: strings.settings });
const item = (name: string) => screen.getByRole("menuitem", { name });

describe("ChatMenu", () => {
  it("opens a labelled menu from the settings button", async () => {
    const { user } = mount(makeState());
    // The open menu hides the rest of the page from assistive tech, so keep the node.
    const button = settings();
    expect(button).not.toHaveAttribute("aria-expanded");
    await user.click(button);
    expect(button).toHaveAttribute("aria-expanded", "true");
    const menu = screen.getByRole("menu");
    const controlled = document.getElementById(button.getAttribute("aria-controls") ?? "");
    expect(controlled).toContainElement(menu);
    expect(menu).toHaveAttribute("aria-labelledby", button.id);
  });

  it("turns the sound on and off", async () => {
    const off = mount(makeState({ soundOn: false }));
    await off.user.click(settings());
    const sound = screen.getByRole("menuitemcheckbox", { name: strings.sound });
    expect(sound).toHaveAttribute("aria-checked", "false");
    await off.user.click(sound);
    expect(off.actions.setSound).toHaveBeenCalledWith(true);
    off.unmount();

    const on = mount(makeState({ soundOn: true }));
    await on.user.click(settings());
    const soundOn = screen.getByRole("menuitemcheckbox", { name: strings.sound });
    expect(soundOn).toHaveAttribute("aria-checked", "true");
    await on.user.click(soundOn);
    expect(on.actions.setSound).toHaveBeenCalledWith(false);
  });

  it("offers download and end chat only once there is a chat", async () => {
    const { user } = mount(makeState());
    await user.click(settings());
    expect(item(strings.download)).toHaveAttribute("aria-disabled", "true");
    expect(item(strings.endChat)).toHaveAttribute("aria-disabled", "true");
  });

  it("downloads the conversation and closes the menu", async () => {
    const { user, actions } = mount(makeState({ session: makeSession({ status: "CLOSED" }) }));
    await user.click(settings());
    expect(item(strings.endChat)).toHaveAttribute("aria-disabled", "true");
    await user.click(item(strings.download));
    expect(actions.download).toHaveBeenCalledTimes(1);
    await waitFor(() => expect(screen.queryByRole("menu")).not.toBeInTheDocument());
  });

  it("asks before ending the chat, and ends it on confirm", async () => {
    const { user, actions } = mount(makeState({ session: makeSession() }));
    await user.click(settings());
    await user.click(item(strings.endChat));
    const dialog = await screen.findByRole("dialog", { name: strings.endTitle });
    expect(actions.endChat).not.toHaveBeenCalled();
    await user.click(screen.getByRole("button", { name: strings.endConfirmYes }));
    expect(actions.endChat).toHaveBeenCalledTimes(1);
    await waitFor(() => expect(dialog).not.toBeInTheDocument());
  });

  it("keeps the chat going when the visitor cancels", async () => {
    const { user, actions } = mount(makeState({ session: makeSession() }));
    await user.click(settings());
    await user.click(item(strings.endChat));
    await user.click(await screen.findByRole("button", { name: strings.cancel }));
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    expect(actions.endChat).not.toHaveBeenCalled();
  });
});
