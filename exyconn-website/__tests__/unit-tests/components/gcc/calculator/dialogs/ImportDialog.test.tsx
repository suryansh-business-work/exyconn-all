// @vitest-environment jsdom
/** Importing a JSON export: checked and previewed, then added as new or replacing (confirmed twice). */
import { fireEvent, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { LIMITS, toExportFile } from "@exyconn/gcc-cost";
import { ImportDialog } from "../../../../../../src/components/gcc/calculator/dialogs/ImportDialog";
import { NOW, liteEstimate, renderInCalculator } from "../../harness";

const exported = (name = "Chennai GCC") =>
  JSON.stringify(toExportFile({ ...liteEstimate(), id: "imported", name }, NOW));
const jsonFile = (text: string) => new File([text], "estimate.json", { type: "application/json" });

function openDialog() {
  const onClose = vi.fn();
  const view = renderInCalculator(<ImportDialog open onClose={onClose} />);
  const input = document.querySelector<HTMLInputElement>('input[type="file"]');
  if (!input) {
    throw new Error("No file input");
  }
  return { ...view, onClose, input };
}

beforeEach(() => {
  vi.spyOn(console, "error").mockImplementation(() => undefined);
});

describe("ImportDialog", () => {
  it("previews a valid export and adds it as a new estimate", async () => {
    const { user, input, store, onClose } = openDialog();
    expect(screen.getByRole("dialog", { name: "Import an estimate" })).toBeInTheDocument();
    expect(input).toHaveAttribute("accept", "application/json,.json");
    await user.upload(input, jsonFile(exported()));
    expect(await screen.findByText(/^“Chennai GCC”, last changed /)).toHaveTextContent(
      /reported in INR: 1 scenario\(s\), \d+ cost item\(s\)\.$/
    );
    await user.click(screen.getByRole("button", { name: "Create as new estimate" }));
    expect(store.importAsNew).toHaveBeenCalledWith(
      expect.objectContaining({ name: "Chennai GCC" })
    );
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("replaces the open estimate only after a second confirmation", async () => {
    const { user, input, store, onClose, estimate } = openDialog();
    await user.upload(input, jsonFile(exported()));
    await user.click(await screen.findByRole("button", { name: "Replace current estimate" }));
    expect(screen.getByText(/A backup of the current version is kept/)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Create as new estimate" })).toBeNull();
    expect(store.replaceActive).not.toHaveBeenCalled();
    await user.click(screen.getByRole("button", { name: "Yes, replace it" }));
    expect(store.replaceActive).toHaveBeenCalledWith(
      expect.objectContaining({ id: estimate.id }),
      expect.objectContaining({ name: "Chennai GCC" })
    );
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("lists every schema problem in a file that does not match", async () => {
    const { user, input } = openDialog();
    const broken = JSON.parse(exported());
    broken.estimate.name = "";
    await user.upload(input, jsonFile(JSON.stringify(broken)));
    const alert = await screen.findByRole("alert");
    expect(alert).toHaveTextContent("The file does not match the estimate schema.");
    expect(alert.querySelectorAll("li").length).toBeGreaterThan(1);
    expect(screen.queryByRole("button", { name: "Create as new estimate" })).toBeNull();
  });

  it("explains a file that is not an estimate, then clears the error for a good one", async () => {
    const { user, input } = openDialog();
    await user.upload(input, jsonFile('{"hello":1}'));
    const alert = await screen.findByRole("alert");
    expect(alert.querySelectorAll("li")).toHaveLength(1);
    expect(alert).toHaveTextContent("This is not an Exyconn GCC estimate file.");
    await user.upload(input, jsonFile(exported()));
    await screen.findByText(/^“Chennai GCC”/);
    expect(screen.queryByText("This is not an Exyconn GCC estimate file.")).toBeNull();
  });

  it("refuses a file over the size limit without reading it", async () => {
    const { user, input } = openDialog();
    const big = jsonFile("{}");
    Object.defineProperty(big, "size", { value: LIMITS.payloadBytes + 1 });
    const text = vi.spyOn(big, "text");
    await user.upload(input, big);
    expect(await screen.findByRole("alert")).toHaveTextContent(/The file is larger than \d/);
    expect(text).not.toHaveBeenCalled();
  });

  it("reports a file the browser cannot read", async () => {
    const { user, input } = openDialog();
    const file = jsonFile("{}");
    vi.spyOn(file, "text").mockRejectedValue(new DOMException("gone", "NotReadableError"));
    await user.upload(input, file);
    expect(await screen.findByRole("alert")).toHaveTextContent("The file could not be read.");
    expect(console.error).toHaveBeenCalled();
  });

  it("does nothing when the file choice is cancelled, and cancel closes with a clean slate", async () => {
    const { user, input, onClose } = openDialog();
    await user.upload(input, jsonFile(exported()));
    await screen.findByText(/^“Chennai GCC”/);
    fireEvent.change(input, { target: { files: [] } });
    await waitFor(() => expect(screen.queryByText(/^“Chennai GCC”/)).toBeNull());
    expect(screen.queryByRole("button", { name: "Create as new estimate" })).toBeNull();
    await user.click(screen.getByRole("button", { name: "Cancel" }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
