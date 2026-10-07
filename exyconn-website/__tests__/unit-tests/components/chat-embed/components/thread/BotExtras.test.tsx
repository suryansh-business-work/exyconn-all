// @vitest-environment jsdom
/** Under a bot answer: its sources, follow-up questions and the thumbs. */
import { screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import {
  Rating,
  Sources,
  Suggestions,
} from "../../../../../../src/components/chat-embed/components/thread/BotExtras";
import { strings } from "../../../../../../src/components/chat-embed/strings";
import { renderInChatTheme } from "../../../../test-utils";
import { makeMessage } from "../../chat-fixtures";

describe("Sources", () => {
  it("renders nothing without safe sources", () => {
    const { container } = renderInChatTheme(
      <Sources sources={[{ title: "Bad", url: "mailto:team@example.test" }]} />
    );
    expect(container).toBeEmptyDOMElement();
  });

  it("links each page in a new tab, by title or else by address", () => {
    renderInChatTheme(
      <Sources
        sources={[
          { title: "Services", url: "https://exyconn.example.test/services" },
          { title: "", url: "https://exyconn.example.test/about" },
        ]}
      />
    );
    const nav = screen.getByRole("navigation", { name: strings.sources });
    expect(nav).toBeInTheDocument();
    const services = screen.getByRole("link", { name: "Services" });
    expect(services).toHaveAttribute("href", "https://exyconn.example.test/services");
    expect(services).toHaveAttribute("target", "_blank");
    expect(
      screen.getByRole("link", { name: "https://exyconn.example.test/about" })
    ).toBeInTheDocument();
  });
});

describe("Suggestions", () => {
  it("renders nothing without suggestions", () => {
    const { container } = renderInChatTheme(<Suggestions suggestions={[]} onAsk={vi.fn()} />);
    expect(container).toBeEmptyDOMElement();
  });

  it("asks the chosen question", async () => {
    const onAsk = vi.fn();
    const { user } = renderInChatTheme(
      <Suggestions suggestions={["What does it cost?", "How long?"]} onAsk={onAsk} />
    );
    expect(screen.getByRole("group", { name: strings.suggestions })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "How long?" }));
    expect(onAsk).toHaveBeenCalledWith("How long?");
  });
});

describe("Rating", () => {
  it("records a thumbs up once and thanks the visitor", async () => {
    const onRate = vi.fn();
    const { user } = renderInChatTheme(<Rating message={makeMessage()} onRate={onRate} />);
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
    const up = screen.getByRole("button", { name: strings.helpful });
    await user.click(up);
    expect(onRate).toHaveBeenCalledWith(true);
    expect(up).toHaveAttribute("aria-pressed", "true");
    expect(up).toBeDisabled();
    expect(screen.getByRole("button", { name: strings.notHelpful })).toBeDisabled();
    expect(screen.getByRole("status")).toHaveTextContent(strings.thanksFeedback);
  });

  it("records a thumbs down", async () => {
    const onRate = vi.fn();
    const { user } = renderInChatTheme(<Rating message={makeMessage()} onRate={onRate} />);
    await user.click(screen.getByRole("button", { name: strings.notHelpful }));
    expect(onRate).toHaveBeenCalledWith(false);
    expect(screen.getByRole("button", { name: strings.notHelpful })).toHaveAttribute(
      "aria-pressed",
      "true"
    );
  });

  it("shows the choice the server already recorded", () => {
    renderInChatTheme(<Rating message={makeMessage({ feedback: "DOWN" })} onRate={vi.fn()} />);
    expect(screen.getByRole("button", { name: strings.notHelpful })).toHaveAttribute(
      "aria-pressed",
      "true"
    );
    expect(screen.getByRole("button", { name: strings.helpful })).toHaveAttribute(
      "aria-pressed",
      "false"
    );
    expect(screen.getByRole("button", { name: strings.helpful })).toBeDisabled();
  });
});
