// @vitest-environment jsdom
/** A shared estimate: read-only report, the owner's revoke panel, and saving a copy locally. */
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { SharedEstimateView } from "../../../../../../src/components/gcc/calculator/share/SharedEstimateView";
import { readIndex } from "../../../../../../src/lib/gcc/storage";
import { DEFAULT_PRESET } from "../../../../lib/gcc/preset-fixture";
import { BRAND, liteEstimate } from "../../harness";

const api = vi.hoisted(() => ({ readSharedEstimate: vi.fn(), revokeShareLink: vi.fn() }));
vi.mock("../../../../../../src/lib/gcc/api", () => api);

const TOKEN = "a".repeat(64);
const KEY = "b".repeat(64);
const PAGE = "/en-us/gcc-in-india/cost-calculator";
const estimate = liteEstimate("Shared GCC");

const show = (hash = `#share=${TOKEN}`) => {
  globalThis.history.replaceState(null, "", `${PAGE}${hash}`);
  return {
    user: userEvent.setup({ delay: null }),
    ...render(<SharedEstimateView token={TOKEN} preset={DEFAULT_PRESET} brand={BRAND} />),
  };
};

beforeEach(() => {
  localStorage.clear();
  vi.spyOn(console, "error").mockImplementation(() => undefined);
});
afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
  vi.clearAllMocks();
});

describe("SharedEstimateView", () => {
  it("says it is opening, then shows the read-only report with its expiry and the brand", async () => {
    api.readSharedEstimate.mockResolvedValue({
      ok: true,
      estimate,
      expiresAt: "2026-10-21T00:00:00.000Z",
    });
    show();
    expect(screen.getByRole("status")).toHaveTextContent("Opening the shared estimate…");
    expect(screen.getByRole("status").tagName).toBe("OUTPUT");
    expect(
      await screen.findByRole("heading", { level: 2, name: "Shared GCC" })
    ).toBeInTheDocument();
    expect(api.readSharedEstimate).toHaveBeenCalledWith(TOKEN);
    expect(
      screen.getByText(/^Shared estimate — read-only\. The link expires /)
    ).toBeInTheDocument();
    expect(screen.getByText("Exyconn · https://exyconn.com")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Open the calculator" })).toHaveAttribute(
      "href",
      `http://localhost:3000${PAGE}`
    );
    expect(screen.queryByText(/Revoke this link/)).toBeNull();
  });

  it("saves a copy to this browser and opens it in the calculator", async () => {
    api.readSharedEstimate.mockResolvedValue({
      ok: true,
      estimate,
      expiresAt: "2026-10-21T00:00:00.000Z",
    });
    const assign = vi.fn();
    const { user } = show();
    const button = await screen.findByRole("button", { name: "Save a copy to this browser" });
    vi.stubGlobal("location", {
      ...globalThis.location,
      origin: "http://localhost:3000",
      pathname: PAGE,
      assign,
    });
    await user.click(button);
    expect(readIndex().entries).toEqual([expect.objectContaining({ name: "Shared GCC" })]);
    expect(readIndex().entries[0].id).not.toBe(estimate.id);
    expect(assign).toHaveBeenCalledWith(`http://localhost:3000${PAGE}`);
  });

  it("says when this browser will not keep the copy", async () => {
    api.readSharedEstimate.mockResolvedValue({
      ok: true,
      estimate,
      expiresAt: "2026-10-21T00:00:00.000Z",
    });
    const { user } = show();
    const button = await screen.findByRole("button", { name: "Save a copy to this browser" });
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new DOMException("full", "QuotaExceededError");
    });
    await user.click(button);
    expect(await screen.findByText(/would not save the copy/)).toBeInTheDocument();
  });

  it("lets the owner revoke the link from its revocation URL", async () => {
    api.readSharedEstimate.mockResolvedValue({
      ok: true,
      estimate,
      expiresAt: "2026-10-21T00:00:00.000Z",
    });
    api.revokeShareLink
      .mockResolvedValueOnce({ ok: false, reason: "unavailable", message: "Try later." })
      .mockResolvedValueOnce({ ok: true });
    const { user } = show(`#share=${TOKEN}&revoke=${KEY}`);
    expect(await screen.findByText(/You opened the revocation link/)).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Revoke now" }));
    expect(
      await screen.findByText("The link could not be revoked: Try later.")
    ).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Revoke now" }));
    expect(await screen.findByText(/The link is revoked/)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Revoke now" })).toBeNull();
    expect(api.revokeShareLink).toHaveBeenLastCalledWith(TOKEN, KEY);
  });

  it.each([
    [{ ok: false, reason: "not-found", message: "" }, /no longer available/],
    [
      { ok: false, reason: "unavailable", message: "Down." },
      "The shared estimate could not be loaded. Down.",
    ],
  ])("explains a link that cannot be shown (%o)", async (result, text) => {
    api.readSharedEstimate.mockResolvedValue(result);
    show();
    expect(await screen.findByText(text)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Open the calculator" })).toBeInTheDocument();
  });

  it("logs a request that throws and says it could not load", async () => {
    api.readSharedEstimate.mockRejectedValue(new Error("boom"));
    show();
    await waitFor(() => expect(console.error).toHaveBeenCalled());
    expect(
      await screen.findByText(/^The shared estimate could not be loaded\./)
    ).toBeInTheDocument();
  });
});
