// @vitest-environment jsdom
/** What replaces the composer once the chat has ended. */
import { screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { EndedState } from "../../../../../../src/components/chat-embed/components/thread/EndedState";
import { strings } from "../../../../../../src/components/chat-embed/strings";
import { renderInChatTheme } from "../../../../test-utils";

describe("EndedState", () => {
  it("says the chat has ended and how to carry on", async () => {
    const onNewChat = vi.fn();
    const onDownload = vi.fn();
    const { user } = renderInChatTheme(
      <EndedState onNewChat={onNewChat} onDownload={onDownload} />
    );
    const status = screen.getByRole("status");
    expect(status).toHaveTextContent(strings.ended);
    expect(status).toHaveTextContent(strings.endedHint);
    await user.click(screen.getByRole("button", { name: strings.newChat }));
    expect(onNewChat).toHaveBeenCalledTimes(1);
    expect(onDownload).not.toHaveBeenCalled();
    await user.click(screen.getByRole("button", { name: strings.download }));
    expect(onDownload).toHaveBeenCalledTimes(1);
  });
});
