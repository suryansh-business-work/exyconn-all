// @vitest-environment jsdom
/** The top of an empty thread: the bot's starters, or the team's welcome. */
import { screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import {
  KnowledgeIntro,
  LiveIntro,
} from "../../../../../../src/components/chat-embed/components/thread/Intros";
import { strings } from "../../../../../../src/components/chat-embed/strings";
import { renderInChatTheme } from "../../../../test-utils";
import { makeConfig } from "../../chat-fixtures";

const FAQS = ["Who are you?", "What do you build?", "Where are you?", "How much?"].map(
  (question, index) => ({ id: `f${index}`, question, answer: "An answer." })
);

describe("KnowledgeIntro", () => {
  it("introduces the bot by name and offers the first three FAQs as starters", async () => {
    const onAsk = vi.fn();
    const { user } = renderInChatTheme(
      <KnowledgeIntro
        config={makeConfig({ botName: "Exy", faqs: FAQS })}
        onAsk={onAsk}
        onTalkToPerson={vi.fn()}
      />
    );
    expect(
      screen.getByRole("heading", { name: strings.knowledgeIntroTitle("Exy") })
    ).toBeInTheDocument();
    expect(screen.getByText(strings.knowledgeIntro)).toBeInTheDocument();
    const starters = screen.getByRole("group", { name: strings.tryAsking });
    expect(starters.querySelectorAll("button")).toHaveLength(3);
    expect(screen.queryByRole("button", { name: "How much?" })).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "What do you build?" }));
    expect(onAsk).toHaveBeenCalledWith("What do you build?");
  });

  it("falls back to the section name and offers no starters without FAQs", () => {
    renderInChatTheme(<KnowledgeIntro config={null} onAsk={vi.fn()} onTalkToPerson={vi.fn()} />);
    expect(
      screen.getByRole("heading", { name: strings.knowledgeIntroTitle(strings.tabKnowledge) })
    ).toBeInTheDocument();
    expect(screen.queryByRole("group")).not.toBeInTheDocument();
  });

  it("hands over to a person", async () => {
    const onTalkToPerson = vi.fn();
    const { user } = renderInChatTheme(
      <KnowledgeIntro config={makeConfig()} onAsk={vi.fn()} onTalkToPerson={onTalkToPerson} />
    );
    await user.click(screen.getByRole("button", { name: strings.talkToPerson }));
    expect(onTalkToPerson).toHaveBeenCalledTimes(1);
  });
});

describe("LiveIntro", () => {
  it("shows the team's welcome under the heading", () => {
    renderInChatTheme(<LiveIntro config={makeConfig({ welcomeMessage: "Namaste!" })} />);
    expect(screen.getByRole("heading", { name: strings.liveIntroTitle })).toBeInTheDocument();
    expect(screen.getByText("Namaste!")).toBeInTheDocument();
  });

  it("shows the heading alone without a welcome", () => {
    const { container } = renderInChatTheme(
      <LiveIntro config={makeConfig({ welcomeMessage: "" })} />
    );
    expect(screen.getByRole("heading", { name: strings.liveIntroTitle })).toBeInTheDocument();
    expect(container.querySelectorAll("p")).toHaveLength(0);
  });
});
