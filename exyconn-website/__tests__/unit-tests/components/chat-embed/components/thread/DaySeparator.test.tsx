// @vitest-environment jsdom
/** The day label between days of a thread. */
import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { DaySeparator } from "../../../../../../src/components/chat-embed/components/thread/DaySeparator";
import { renderInChatTheme } from "../../../../test-utils";

describe("DaySeparator", () => {
  it("shows the day as a presentational divider", () => {
    const { container } = renderInChatTheme(<DaySeparator label="Yesterday" />);
    expect(screen.getByText("Yesterday")).toBeInTheDocument();
    expect(container.firstElementChild).toHaveAttribute("role", "presentation");
    expect(screen.queryByRole("separator")).not.toBeInTheDocument();
  });
});
