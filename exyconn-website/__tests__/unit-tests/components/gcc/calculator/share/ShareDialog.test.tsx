// @vitest-environment jsdom
/** Sharing: the share sheet, the clipboard, the JSON file and the consented read-only link. */
import { screen, waitFor, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ShareDialog } from "../../../../../../src/components/gcc/calculator/share/ShareDialog";
import { liteEstimate, renderInCalculator } from "../../harness";

const files = vi.hoisted(() => ({ saveText: vi.fn() }));
vi.mock("../../../../../../src/lib/gcc/download", async (importOriginal) => ({
  ...(await importOriginal<typeof import("../../../../../../src/lib/gcc/download")>()),
  saveText: files.saveText,
}));
vi.mock("../../../../../../src/lib/gcc/api", () => ({
  createShareLink: vi.fn(),
  revokeShareLink: vi.fn(),
}));
vi.mock("../../../../../../src/components/forms/shared/postFormSubmission", () => ({
  fetchCaptcha: vi.fn().mockResolvedValue({ token: "q", question: "2 + 3" }),
}));

const estimate = liteEstimate();

function openDialog() {
  const onClose = vi.fn();
  const view = renderInCalculator(<ShareDialog open estimate={estimate} onClose={onClose} />, {
    estimate,
  });
  return {
    ...view,
    onClose,
    dialog: screen.getByRole("dialog", { name: "Share or copy this estimate" }),
  };
}

const stubNavigator = (extra: Record<string, unknown>) =>
  vi.stubGlobal("navigator", { ...globalThis.navigator, language: "en-IN", ...extra });

beforeEach(() => {
  vi.spyOn(console, "error").mockImplementation(() => undefined);
});
afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
  vi.clearAllMocks();
});

describe("ShareDialog", () => {
  it("shows the summary with the brand, and closes", async () => {
    const { user, dialog, onClose } = openDialog();
    const summary = within(dialog).getByRole("textbox", { name: "Copy summary" });
    expect(summary).toHaveAttribute("readonly");
    expect((summary as HTMLTextAreaElement).value).toMatch(/Exyconn · https:\/\/exyconn\.com$/);
    expect(within(dialog).queryByRole("button", { name: "Share…" })).toBeNull();
    await user.click(within(dialog).getByRole("button", { name: "Close" }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("copies the summary, or explains when the browser blocks it", async () => {
    const { user, dialog } = openDialog();
    // After render: user-event installs its own clipboard when it is set up.
    const writeText = vi
      .fn()
      .mockResolvedValueOnce(undefined)
      .mockRejectedValueOnce(new Error("denied"));
    stubNavigator({ clipboard: { writeText } });
    await user.click(within(dialog).getByRole("button", { name: "Copy summary" }));
    expect(await within(dialog).findByText("Summary copied to the clipboard.")).toBeInTheDocument();
    expect(writeText).toHaveBeenCalledWith(expect.stringContaining("Pune GCC"));
    await user.click(within(dialog).getByRole("button", { name: "Copy summary" }));
    expect(
      await within(dialog).findByText(/Copying was blocked by the browser/)
    ).toBeInTheDocument();
  });

  it("downloads the estimate as JSON", async () => {
    const { user, dialog } = openDialog();
    await user.click(within(dialog).getByRole("button", { name: "Download JSON to send" }));
    const [text, name, type] = files.saveText.mock.calls[0];
    expect(JSON.parse(text).estimate.id).toBe(estimate.id);
    expect([name, type]).toEqual(["pune-gcc.json", "application/json"]);
  });

  it("opens the device's share sheet where there is one", async () => {
    const share = vi.fn().mockResolvedValue(undefined);
    stubNavigator({ share });
    const { user, dialog } = openDialog();
    await user.click(within(dialog).getByRole("button", { name: "Share…" }));
    expect(share).toHaveBeenCalledWith({
      title: "Pune GCC",
      text: expect.stringContaining("Exyconn"),
    });
  });

  it("stays quiet when the share sheet is dismissed, and logs any other failure", async () => {
    const share = vi
      .fn()
      .mockRejectedValueOnce(new DOMException("closed", "AbortError"))
      .mockRejectedValueOnce(new DOMException("denied", "NotAllowedError"))
      .mockRejectedValueOnce(new Error("broken"));
    stubNavigator({ share });
    const { user, dialog } = openDialog();
    const button = within(dialog).getByRole("button", { name: "Share…" });
    const failures = () =>
      vi
        .mocked(console.error)
        .mock.calls.filter(([message]) => message === "GCC calculator: native share failed");
    await user.click(button);
    await waitFor(() => expect(share).toHaveBeenCalledTimes(1));
    expect(failures()).toHaveLength(0);
    await user.click(button);
    await user.click(button);
    await waitFor(() => expect(failures()).toHaveLength(2));
  });
});
