// @vitest-environment jsdom
/** The name dialog: starts from the given name, requires one, trims it and caps its length. */
import { screen, waitFor } from "@testing-library/react";
import { useState } from "react";
import { describe, expect, it, vi } from "vitest";
import {
  NameDialog,
  type NameRequest,
} from "../../../../../../src/components/gcc/calculator/dialogs/NameDialog";
import { renderWithUser } from "../../../../test-utils";

function Host({ initial }: Readonly<{ initial: NameRequest }>) {
  const [request, setRequest] = useState<NameRequest | null>(initial);
  return <NameDialog request={request} onClose={() => setRequest(null)} />;
}

const request = (extra: Partial<NameRequest> = {}): NameRequest => ({
  title: "Rename",
  label: "Estimate name",
  initial: "Pune GCC",
  submitLabel: "Save name",
  onSubmit: vi.fn(),
  ...extra,
});

describe("NameDialog", () => {
  it("is closed without a request", () => {
    renderWithUser(<NameDialog request={null} onClose={vi.fn()} />);
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("submits the trimmed new name and closes", async () => {
    const asked = request();
    const { user } = renderWithUser(<Host initial={asked} />);
    const field = await screen.findByRole("textbox", { name: "Estimate name" });
    await waitFor(() => expect(field).toHaveValue("Pune GCC"));
    expect(field).toHaveAttribute("maxlength", "120");
    await user.clear(field);
    await user.type(field, "  Bengaluru GCC  ");
    await user.click(screen.getByRole("button", { name: "Save name" }));
    expect(asked.onSubmit).toHaveBeenCalledWith("Bengaluru GCC");
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
  });

  it("requires a name", async () => {
    const asked = request();
    const { user } = renderWithUser(<Host initial={asked} />);
    const field = await screen.findByRole("textbox", { name: "Estimate name" });
    await waitFor(() => expect(field).toHaveValue("Pune GCC"));
    await user.clear(field);
    await user.type(field, "   ");
    await user.click(screen.getByRole("button", { name: "Save name" }));
    expect(await screen.findByText("Enter a name")).toBeInTheDocument();
    expect(field).toHaveAttribute("aria-invalid", "true");
    expect(asked.onSubmit).not.toHaveBeenCalled();
  });

  it("cuts a name to the request's own limit", async () => {
    const asked = request({ maxLength: 4, initial: "Scenario A" });
    const { user } = renderWithUser(<Host initial={asked} />);
    const field = await screen.findByRole("textbox", { name: "Estimate name" });
    expect(field).toHaveAttribute("maxlength", "4");
    await waitFor(() => expect(field).toHaveValue("Scenario A"));
    await user.click(screen.getByRole("button", { name: "Save name" }));
    expect(asked.onSubmit).toHaveBeenCalledWith("Scen");
  });

  it("closes without submitting on cancel", async () => {
    const asked = request();
    const { user } = renderWithUser(<Host initial={asked} />);
    await user.click(screen.getByRole("button", { name: "Cancel" }));
    expect(asked.onSubmit).not.toHaveBeenCalled();
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
  });
});
