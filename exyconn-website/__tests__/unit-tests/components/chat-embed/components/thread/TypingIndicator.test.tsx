// @vitest-environment jsdom
/** "Ana is typing" with three dots. */
import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { TypingIndicator } from "../../../../../../src/components/chat-embed/components/thread/TypingIndicator";
import { strings } from "../../../../../../src/components/chat-embed/strings";
import { renderInChatTheme } from "../../../../test-utils";

describe("TypingIndicator", () => {
  it("names who is typing and hides the dots from screen readers", () => {
    const { container } = renderInChatTheme(<TypingIndicator name="Ana" />);
    expect(screen.getByText(strings.typing("Ana"))).toBeInTheDocument();
    const dots = container.querySelector('[aria-hidden="true"]');
    expect(dots?.querySelectorAll("span")).toHaveLength(3);
  });
});
