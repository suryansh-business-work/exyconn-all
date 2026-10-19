// @vitest-environment jsdom
/** The confirmation dialog: confirm runs the action once and closes, cancel only closes. */
import { screen } from "@testing-library/react";
import { useState } from "react";
import { describe, expect, it, vi } from "vitest";
import {
  ConfirmDialog,
  type ConfirmRequest,
} from "../../../../../../src/components/gcc/calculator/dialogs/ConfirmDialog";
import { renderWithUser } from "../../../../test-utils";

function Host({ initial }: Readonly<{ initial: ConfirmRequest }>) {
  const [request, setRequest] = useState<ConfirmRequest | null>(initial);
  return <ConfirmDialog request={request} onClose={() => setRequest(null)} />;
}

const request = (destructive?: boolean): ConfirmRequest => ({
  title: "Delete estimate",
  message: "This cannot be undone.",
  confirmLabel: "Delete",
  destructive,
  onConfirm: vi.fn(),
});

describe("ConfirmDialog", () => {
  it("names itself by its title, describes itself by its message and stays closed without a request", () => {
    renderWithUser(<ConfirmDialog request={null} onClose={vi.fn()} />);
    expect(screen.queryByRole("dialog")).toBeNull();
    renderWithUser(<Host initial={request()} />);
    const dialog = screen.getByRole("dialog", { name: "Delete estimate" });
    expect(dialog).toHaveAccessibleDescription("This cannot be undone.");
  });

  it("runs a destructive action once, even when confirm is pressed again as it closes", async () => {
    const asked = request(true);
    const { user } = renderWithUser(<Host initial={asked} />);
    const confirm = screen.getByRole("button", { name: "Delete" });
    expect(confirm).toHaveClass("MuiButton-colorError");
    await user.click(confirm);
    expect(asked.onConfirm).toHaveBeenCalledTimes(1);
    // Still on screen while the dialog fades out.
    expect(confirm).toBeInTheDocument();
    await user.click(confirm);
    expect(asked.onConfirm).toHaveBeenCalledTimes(1);
  });

  it("uses the primary colour for an action that is not destructive, and cancel runs nothing", async () => {
    const asked = request();
    const { user } = renderWithUser(<Host initial={asked} />);
    expect(screen.getByRole("button", { name: "Delete" })).toHaveClass("MuiButton-colorPrimary");
    await user.click(screen.getByRole("button", { name: "Cancel" }));
    expect(asked.onConfirm).not.toHaveBeenCalled();
  });
});
