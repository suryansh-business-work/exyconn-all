// @vitest-environment jsdom
/** The FAQs: searchable answers, and a way on to a person or the bot. */
import { screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { FaqSection } from "../../../../../../src/components/chat-embed/components/sections/FaqSection";
import { strings } from "../../../../../../src/components/chat-embed/strings";
import type { FaqItem } from "../../../../../../src/components/chat-embed/types";
import { renderInChatTheme } from "../../../../test-utils";

const FAQS: FaqItem[] = [
  { id: "f1", question: "Do you build AI agents?", answer: "Yes, for real operations." },
  { id: "f2", question: "Where are you based?", answer: "We work remotely across India." },
  { id: "f3", question: "How do projects start?", answer: "With a short discovery call." },
];

function mount(faqs: readonly FaqItem[] = FAQS) {
  const onTab = vi.fn();
  const view = renderInChatTheme(<FaqSection faqs={faqs} onTab={onTab} />);
  return { ...view, onTab };
}

const questions = () => screen.getAllByRole("button", { name: /\?$/ });

describe("FaqSection", () => {
  it("says there are no FAQs yet, without a search box", () => {
    mount([]);
    expect(screen.getByRole("status")).toHaveTextContent(strings.noFaqs);
    expect(screen.queryByRole("searchbox")).not.toBeInTheDocument();
  });

  it("lists every question with a search box that controls the list", () => {
    mount();
    expect(questions()).toHaveLength(3);
    const search = screen.getByRole("searchbox", { name: strings.searchFaqs });
    const list = document.getElementById(search.getAttribute("aria-controls") ?? "");
    expect(list).toContainElement(questions()[0]);
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });

  it("matches every word of the search, in questions and answers, ignoring case", async () => {
    const { user } = mount();
    await user.type(screen.getByRole("searchbox"), "  DISCOVERY call ");
    expect(questions().map((button) => button.textContent)).toEqual(["How do projects start?"]);
  });

  it("says when nothing matches", async () => {
    const { user } = mount();
    await user.type(screen.getByRole("searchbox"), "pricing");
    expect(screen.queryAllByRole("button", { name: /\?$/ })).toHaveLength(0);
    expect(screen.getByRole("status")).toHaveTextContent(strings.noFaqMatch);
  });

  it("opens an answer", async () => {
    const { user } = mount();
    const question = screen.getByRole("button", { name: FAQS[1].question });
    expect(question).toHaveAttribute("aria-expanded", "false");
    await user.click(question);
    expect(question).toHaveAttribute("aria-expanded", "true");
    await waitFor(() => expect(screen.getByText(FAQS[1].answer)).toBeVisible());
  });

  it("offers a person and the Knowledge Bot for anything else", async () => {
    const { user, onTab } = mount([]);
    expect(screen.getByRole("heading", { name: strings.stillNeedHelp })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: strings.chatWithUs }));
    await user.click(screen.getByRole("button", { name: strings.askTheBot }));
    expect(onTab.mock.calls).toEqual([["LIVE"], ["KNOWLEDGE"]]);
  });
});
