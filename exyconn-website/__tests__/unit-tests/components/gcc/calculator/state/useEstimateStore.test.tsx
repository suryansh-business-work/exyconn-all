// @vitest-environment jsdom
/** The estimates saved in this browser: first visit, reopening, saving, other tabs and imports. */
import { act, renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { Estimate } from "@exyconn/gcc-cost";
import { useEstimateStore } from "../../../../../../src/components/gcc/calculator/state/useEstimateStore";
import {
  estimateKey,
  readEstimate,
  readIndex,
  saveEstimate,
} from "../../../../../../src/lib/gcc/storage";
import { DEFAULT_PRESET } from "../../../../lib/gcc/preset-fixture";
import { liteEstimate, presetEstimate } from "../../harness";

const mount = (scenario: string | null = null) =>
  renderHook(() => useEstimateStore(DEFAULT_PRESET, scenario));

const stored = (name: string, id = name.toLowerCase().replaceAll(" ", "-")): Estimate => {
  const estimate = { ...liteEstimate(name), id };
  saveEstimate(estimate, null);
  return estimate;
};

const otherTabSaves = (estimate: Estimate, newValue: string | null = "{}") =>
  act(() => {
    globalThis.dispatchEvent(
      new StorageEvent("storage", { key: estimateKey(estimate.id), newValue })
    );
  });

const quota = () =>
  vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
    throw new DOMException("full", "QuotaExceededError");
  });

beforeEach(() => {
  localStorage.clear();
  vi.spyOn(console, "error").mockImplementation(() => undefined);
});
afterEach(() => vi.restoreAllMocks());

describe("useEstimateStore on mount", () => {
  it("creates and saves a first estimate on the scenario a preset link names", () => {
    const lean = DEFAULT_PRESET.scenarios.find((s) => s.id !== DEFAULT_PRESET.scenarios[0].id);
    const { result } = mount(lean?.id ?? null);
    expect(result.current.active?.name).toBe("My GCC estimate");
    expect(result.current.active?.activeScenarioId).toBe(lean?.id);
    expect(result.current.entries).toHaveLength(1);
    expect(result.current.presetOffer).toBeNull();
    expect(result.current.revision).toBe(1);
  });

  it("ignores a preset scenario that does not exist", () => {
    const { result } = mount("unknown");
    expect(result.current.active?.activeScenarioId).toBe(presetEstimate().activeScenarioId);
  });

  it("reopens the active estimate and keeps a preset offer for later", () => {
    stored("Pune GCC");
    const chennai = stored("Chennai GCC");
    const { result } = mount("lean");
    expect(result.current.active?.id).toBe(chennai.id);
    expect(result.current.entries.map((entry) => entry.name)).toEqual(["Chennai GCC", "Pune GCC"]);
    expect(result.current.presetOffer).toBe("lean");
    act(() => result.current.dismissPresetOffer());
    expect(result.current.presetOffer).toBeNull();
  });

  it("skips an unreadable estimate with a notice and opens the next one", () => {
    const pune = stored("Pune GCC");
    const broken = stored("Broken");
    localStorage.setItem(estimateKey(broken.id), "{not json");
    const { result } = mount();
    expect(result.current.active?.id).toBe(pune.id);
    expect(result.current.notice).toMatch(/could not be read/);
    act(() => result.current.dismissNotice());
    expect(result.current.notice).toBeNull();
  });

  it("says when a listed estimate is missing", () => {
    const gone = stored("Gone");
    localStorage.removeItem(estimateKey(gone.id));
    const { result } = mount();
    expect(result.current.notice).toBe("A saved estimate was not found in this browser.");
    expect(result.current.active?.name).toBe("My GCC estimate");
  });

  it("still opens a new estimate in memory when storage is full or blocked", () => {
    quota();
    const full = mount();
    expect(full.result.current.active).not.toBeNull();
    expect(full.result.current.saveState).toEqual({ kind: "error", reason: "quota" });
    full.unmount();
    vi.restoreAllMocks();
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("blocked");
    });
    const blocked = mount();
    expect(blocked.result.current.saveState).toEqual({ kind: "error", reason: "unavailable" });
  });
});

describe("saving", () => {
  it("saves an edit with a new stamp", () => {
    const { result } = mount();
    const edited = { ...(result.current.active as Estimate), name: "Edited" };
    let stamp: string | null = null;
    act(() => {
      stamp = result.current.persist(edited);
    });
    expect(stamp).not.toBeNull();
    expect(result.current.saveState).toEqual({ kind: "saved", at: stamp });
    expect(result.current.entries[0].name).toBe("Edited");
  });

  it("stops at a copy another tab saved, then keeps this tab's version on request", () => {
    const { result } = mount();
    const mine = result.current.active as Estimate;
    saveEstimate(
      { ...mine, name: "Theirs", updatedAt: "2026-10-15T00:00:00.000Z" },
      mine.updatedAt
    );
    let stamp: string | null = "unset";
    act(() => {
      stamp = result.current.persist({ ...mine, name: "Mine" });
    });
    expect(stamp).toBeNull();
    expect(result.current.saveState).toEqual({ kind: "conflict" });
    act(() => result.current.keepMine({ ...mine, name: "Mine" }));
    const read = readEstimate(mine.id);
    expect(read.ok && read.estimate.name).toBe("Mine");
  });

  it("keeps this tab's version even when the stored copy has vanished", () => {
    const { result } = mount();
    const mine = result.current.active as Estimate;
    localStorage.removeItem(estimateKey(mine.id));
    act(() => result.current.keepMine({ ...mine, name: "Mine" }));
    expect(result.current.saveState.kind).toBe("saved");
  });

  it("reports a failed save", () => {
    const { result } = mount();
    quota();
    act(() => {
      result.current.persist(result.current.active as Estimate);
    });
    expect(result.current.saveState).toEqual({ kind: "error", reason: "quota" });
  });

  it("lets the calculator set the save state", () => {
    const { result } = mount();
    act(() => result.current.setSaveState({ kind: "pending" }));
    expect(result.current.saveState).toEqual({ kind: "pending" });
  });
});

describe("other tabs", () => {
  it("flags a conflict when another tab saves the open estimate, and loads theirs on request", () => {
    const { result } = mount();
    const mine = result.current.active as Estimate;
    saveEstimate(
      { ...mine, name: "Theirs", updatedAt: "2026-10-15T00:00:00.000Z" },
      mine.updatedAt
    );
    otherTabSaves(mine);
    expect(result.current.saveState).toEqual({ kind: "conflict" });
    act(() => result.current.keepTheirs());
    expect(result.current.active?.name).toBe("Theirs");
    expect(result.current.saveState).toEqual({ kind: "idle" });
  });

  it("only refreshes the list for another estimate or a removal", () => {
    const { result } = mount();
    const mine = result.current.active as Estimate;
    const other = stored("Other");
    otherTabSaves(other);
    otherTabSaves(mine, null);
    expect(result.current.saveState).toEqual({ kind: "idle" });
    expect(result.current.entries.map((entry) => entry.name)).toContain("Other");
  });
});

describe("managing estimates", () => {
  it("opens, creates and duplicates estimates", () => {
    const pune = stored("Pune GCC");
    const { result } = mount();
    act(() => result.current.create("Second"));
    expect(result.current.active?.name).toBe("Second");
    let opened = false;
    act(() => {
      opened = result.current.open(pune.id);
    });
    expect(opened).toBe(true);
    expect(result.current.active?.id).toBe(pune.id);
    act(() => {
      opened = result.current.open("missing");
    });
    expect(opened).toBe(false);
    act(() => result.current.duplicate(pune, "Pune copy"));
    expect(result.current.active?.name).toBe("Pune copy");
    expect(result.current.active?.id).not.toBe(pune.id);
    act(() => result.current.importAsNew({ ...pune, name: "Imported" }));
    expect(result.current.active?.name).toBe("Imported");
    expect(readIndex().entries).toHaveLength(4);
  });

  it("removes an estimate and opens the next, or a new one when none is left", () => {
    const pune = stored("Pune GCC");
    const chennai = stored("Chennai GCC");
    const { result } = mount();
    act(() => result.current.remove(chennai.id));
    expect(result.current.active?.id).toBe(pune.id);
    act(() => result.current.remove(pune.id));
    expect(result.current.active?.name).toBe("My GCC estimate");
  });

  it("creates a new estimate when the next one cannot be read", () => {
    const pune = stored("Pune GCC");
    const chennai = stored("Chennai GCC");
    const { result } = mount();
    localStorage.setItem(estimateKey(pune.id), "{bad");
    act(() => result.current.remove(chennai.id));
    expect(result.current.active?.name).toBe("My GCC estimate");
  });

  it("replaces the open estimate with an import, keeping its identity and a backup", () => {
    const { result } = mount();
    const current = result.current.active as Estimate;
    act(() => result.current.replaceActive(current, { ...liteEstimate("Imported"), id: "x" }));
    expect(result.current.active).toMatchObject({
      id: current.id,
      name: "Imported",
      createdAt: current.createdAt,
    });
    expect(localStorage.getItem(`exyconn.gcc.v1.backup.${current.id}`)).not.toBeNull();
  });

  it("reports a conflict or a full storage when an import replaces the open estimate", async () => {
    const { result } = mount();
    const current = result.current.active as Estimate;
    saveEstimate({ ...current, updatedAt: "2026-10-15T00:00:00.000Z" }, current.updatedAt);
    act(() => result.current.replaceActive(current, liteEstimate("Imported")));
    expect(result.current.saveState).toEqual({ kind: "conflict" });

    const again = mount();
    quota();
    act(() =>
      again.result.current.replaceActive(again.result.current.active as Estimate, liteEstimate("X"))
    );
    await waitFor(() =>
      expect(again.result.current.saveState).toEqual({ kind: "error", reason: "quota" })
    );
  });
});
