// @vitest-environment jsdom
/** "End this chat?": the destructive step always asks first. */
import { screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { EndChatDialog } from "../../../../../../src/components/chat-embed/components/header/EndChatDialog";
import { strings } from "../../../../../../src/components/chat-embed/strings";
import { renderInChatTheme } from "../../../../test-utils";

function mount(open: boolean) {
  const onCancel = vi.fn();
  const onConfirm = vi.fn();
  const view = renderInChatTheme(
    <EndChatDialog open={open} onCancel={onCancel} onConfirm={onConfirm} />
  );
  return { ...view, onCancel, onConfirm };
}

describe("EndChatDialog", () => {
  it("shows nothing until asked", () => {
    mount(false);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("asks, explains, and puts the focus on Cancel", () => {
    mount(true);
    const dialog = screen.getByRole("dialog", { name: strings.endTitle });
    expect(dialog).toHaveAccessibleDescription(strings.endConfirm);
    expect(screen.getByRole("button", { name: strings.cancel })).toHaveFocus();
  });

  it("cancels from the button and from Escape", async () => {
    const { user, onCancel, onConfirm } = mount(true);
    await user.click(screen.getByRole("button", { name: strings.cancel }));
    await user.keyboard("{Escape}");
    expect(onCancel).toHaveBeenCalledTimes(2);
    expect(onConfirm).not.toHaveBeenCalled();
  });

  it("ends the chat on confirm", async () => {
    const { user, onConfirm } = mount(true);
    await user.click(screen.getByRole("button", { name: strings.endConfirmYes }));
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });
});
