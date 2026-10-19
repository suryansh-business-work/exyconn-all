// @vitest-environment jsdom
/** The island's entry: a saved estimate opens on the step in the URL; a share link opens read-only. */
import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import * as entry from "../../../../../src/components/gcc/calculator";
import GccCalculator from "../../../../../src/components/gcc/calculator/GccCalculator";
import { saveEstimate } from "../../../../../src/lib/gcc/storage";
import { DEFAULT_PRESET } from "../../../lib/gcc/preset-fixture";
import { BRAND, liteEstimate } from "../harness";

const api = vi.hoisted(() => ({
  readSharedEstimate: vi.fn(),
  fetchCurrencies: vi.fn(),
  fetchFxRates: vi.fn(),
}));
vi.mock("../../../../../src/lib/gcc/api", () => api);

const PAGE = "/en-us/gcc-in-india/cost-calculator";
const open = (hash = "") => {
  globalThis.history.replaceState(null, "", `${PAGE}${hash}`);
  return render(<GccCalculator preset={DEFAULT_PRESET} brand={BRAND} />);
};

beforeEach(() => {
  localStorage.clear();
  saveEstimate(liteEstimate(), null);
  api.fetchCurrencies.mockResolvedValue({ ok: false, reason: "unavailable", message: "" });
});
afterEach(() => vi.clearAllMocks());

describe("GccCalculator", () => {
  it("is what the package entry exports", () => {
    expect(entry.GccCalculator).toBe(GccCalculator);
  });

  it("opens the saved estimate on the step the URL names", async () => {
    open("#step=office");
    expect(
      await screen.findByRole("heading", { level: 2, name: "Location & office" })
    ).toBeInTheDocument();
    expect(screen.getByRole("combobox", { name: "Estimate" })).toHaveTextContent("Pune GCC");
  });

  it("opens on the profile for a step it does not know, and keeps the step in the URL", async () => {
    const rafs: FrameRequestCallback[] = [];
    vi.spyOn(globalThis, "requestAnimationFrame").mockImplementation((callback) => {
      rafs.push(callback);
      return rafs.length;
    });
    open("#step=nowhere");
    expect(
      await screen.findByRole("heading", { level: 2, name: "Company & GCC profile" })
    ).toBeInTheDocument();
    const user = userEvent.setup({ delay: null });
    await user.click(screen.getByRole("button", { name: /Location & office/ }));
    expect(globalThis.location.hash).toBe("#step=office");
    act(() => rafs.forEach((callback) => callback(0)));
    await waitFor(() =>
      expect(document.activeElement).toBe(
        screen.getByRole("heading", { level: 2, name: "Location & office" })
      )
    );
  });

  it("shows a shared estimate read-only instead of the saved ones", async () => {
    api.readSharedEstimate.mockReturnValue(new Promise(() => undefined));
    open(`#share=${"a".repeat(64)}`);
    expect(screen.getByRole("status")).toHaveTextContent("Opening the shared estimate…");
    expect(screen.queryByRole("combobox", { name: "Estimate" })).toBeNull();
  });
});
