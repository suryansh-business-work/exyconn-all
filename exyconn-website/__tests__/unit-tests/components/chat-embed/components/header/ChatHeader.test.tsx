// @vitest-environment jsdom
/** The header: who the visitor talks to, whether the team is in, the menu and the countdown. */
import { screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ChatHeader } from "../../../../../../src/components/chat-embed/components/header/ChatHeader";
import type { ChatState, Tab } from "../../../../../../src/components/chat-embed/state/state";
import { strings } from "../../../../../../src/components/chat-embed/strings";
import { renderInChatTheme } from "../../../../test-utils";
import { makeActions, makeConfig, makeSession, makeState } from "../../chat-fixtures";

const TITLE_ID = "chat-title";
const inTenMinutes = () => new Date(Date.now() + 600_000).toISOString();

function mount(state: ChatState, tab: Tab) {
  const onClose = vi.fn();
  const view = renderInChatTheme(
    <ChatHeader
      titleId={TITLE_ID}
      state={state}
      actions={makeActions()}
      tab={tab}
      onClose={onClose}
    />
  );
  return { ...view, onClose };
}

const title = () => screen.getByRole("heading", { level: 1 });

describe("ChatHeader", () => {
  it("titles the live chat with the site's name and shows the team's status", () => {
    mount(makeState({ config: makeConfig({ online: false }) }), "LIVE");
    expect(title()).toHaveTextContent(strings.defaultTitle);
    expect(title()).toHaveAttribute("id", TITLE_ID);
    expect(screen.getByText(strings.offline)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: strings.settings })).toBeInTheDocument();
  });

  it("titles the Knowledge Bot with its configured name, always online", () => {
    mount(makeState({ config: makeConfig({ botName: "Exy", online: false }) }), "KNOWLEDGE");
    expect(title()).toHaveTextContent("Exy");
    expect(screen.getByText(strings.online)).toBeInTheDocument();
  });

  it("falls back to the section name before the config arrives", () => {
    mount(makeState(), "KNOWLEDGE");
    expect(title()).toHaveTextContent(strings.tabKnowledge);
    expect(screen.queryByText(strings.online)).not.toBeInTheDocument();
  });

  it("shows the countdown on an open chat's thread", () => {
    const session = makeSession({ expiresAt: inTenMinutes() });
    mount(makeState({ config: makeConfig(), session }), "LIVE");
    expect(screen.getByText(/^Chat ends in \d+:\d\d without a reply$/)).toBeInTheDocument();
  });

  it("hides the countdown on the FAQs and on a closed chat", () => {
    const open = makeSession({ expiresAt: inTenMinutes() });
    const faqs = mount(makeState({ session: open }), "FAQS");
    expect(screen.queryByText(/Chat ends in/)).not.toBeInTheDocument();
    faqs.unmount();
    mount(
      makeState({ session: makeSession({ status: "CLOSED", expiresAt: inTenMinutes() }) }),
      "LIVE"
    );
    expect(screen.queryByText(/Chat ends in/)).not.toBeInTheDocument();
  });

  it("minimises the chat", async () => {
    const { user, onClose } = mount(makeState(), "LIVE");
    await user.click(screen.getByRole("button", { name: strings.minimise }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
