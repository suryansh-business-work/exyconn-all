// @vitest-environment jsdom
/** The save indicator: one sentence per save state, and the choice after another tab saved. */
import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { SaveStatus } from "../../../../../../src/components/gcc/calculator/layout/SaveStatus";
import type { SaveState } from "../../../../../../src/components/gcc/calculator/state/useEstimateStore";
import { liteEstimate, renderInCalculator } from "../../harness";

const show = (saveState: SaveState, estimate = liteEstimate()) =>
  renderInCalculator(<SaveStatus />, { store: { saveState }, estimate });

describe("SaveStatus", () => {
  it.each<[SaveState, RegExp | string]>([
    [{ kind: "idle" }, "Saved locally"],
    [{ kind: "pending" }, "Saving…"],
    [{ kind: "saved", at: "2026-10-14T09:30:00.000Z" }, /^Saved locally · \d/],
    [
      { kind: "invalid", count: 1 },
      "Not saved — fix 1 highlighted field to save and update totals",
    ],
    [
      { kind: "invalid", count: 3 },
      "Not saved — fix 3 highlighted fields to save and update totals",
    ],
    [{ kind: "error", reason: "quota" }, /Browser storage is full/],
    [{ kind: "error", reason: "unavailable" }, /This browser is not saving/],
  ])("says %o in a polite live region", (saveState, text) => {
    show(saveState);
    const status = screen.getByRole("status");
    expect(status).toHaveAttribute("aria-live", "polite");
    expect(status).toHaveClass(`gcc-save--${saveState.kind}`);
    expect(status).toHaveTextContent(text);
    expect(screen.queryByRole("alert")).toBeNull();
  });

  it("offers both versions after another tab saved, keeping this one when it is valid", async () => {
    const { user, store } = show({ kind: "conflict" });
    expect(screen.getByRole("status")).toHaveTextContent(/changed in another tab/);
    await user.click(screen.getByRole("button", { name: "Load the other tab's version" }));
    expect(store.keepTheirs).toHaveBeenCalledTimes(1);
    const keepMine = screen.getByRole("button", { name: "Keep this tab's version" });
    // Live totals settle a moment after the first render.
    await screen.findByRole("button", { name: "Keep this tab's version" });
    await expect.poll(() => keepMine.hasAttribute("disabled")).toBe(false);
    await user.click(keepMine);
    expect(store.keepMine).toHaveBeenCalledWith(expect.objectContaining({ name: "Pune GCC" }));
  });

  it("cannot keep this tab's version while it is invalid", () => {
    show({ kind: "conflict" }, { ...liteEstimate(), name: "" });
    expect(screen.getByRole("button", { name: "Keep this tab's version" })).toBeDisabled();
  });
});
