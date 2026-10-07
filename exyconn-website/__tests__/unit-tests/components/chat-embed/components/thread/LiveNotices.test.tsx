// @vitest-environment jsdom
/** Above the live thread: who has the chat, and the offline message out of hours. */
import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { LiveNotices } from "../../../../../../src/components/chat-embed/components/thread/LiveNotices";
import { strings } from "../../../../../../src/components/chat-embed/strings";
import { renderInChatTheme } from "../../../../test-utils";
import { makeConfig, makeSession } from "../../chat-fixtures";

const AWAY = "We are away right now.";

describe("LiveNotices", () => {
  it("renders nothing while the team is in and nobody has the chat", () => {
    const { container } = renderInChatTheme(
      <LiveNotices config={makeConfig()} session={makeSession()} />
    );
    expect(container).toBeEmptyDOMElement();
  });

  it("renders nothing before the config arrives", () => {
    const { container } = renderInChatTheme(<LiveNotices config={null} session={makeSession()} />);
    expect(container).toBeEmptyDOMElement();
  });

  it("names the team member who has the chat, with their initial", () => {
    renderInChatTheme(
      <LiveNotices config={makeConfig()} session={makeSession({ agentName: "ana" })} />
    );
    expect(screen.getByText(strings.chattingWith("ana"))).toBeInTheDocument();
    expect(screen.getByText("A")).toBeInTheDocument();
    expect(screen.queryByText(AWAY)).not.toBeInTheDocument();
  });

  it("shows the offline message on an open chat out of hours", () => {
    renderInChatTheme(
      <LiveNotices config={makeConfig({ online: false })} session={makeSession()} />
    );
    expect(screen.getByText(AWAY)).toBeInTheDocument();
  });

  it("drops the offline message once the chat has ended", () => {
    renderInChatTheme(
      <LiveNotices
        config={makeConfig({ online: false })}
        session={makeSession({ status: "CLOSED", agentName: "Ana" })}
      />
    );
    expect(screen.queryByText(AWAY)).not.toBeInTheDocument();
    expect(screen.getByText(strings.chattingWith("Ana"))).toBeInTheDocument();
  });
});
