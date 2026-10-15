// @vitest-environment jsdom
/** The calculator's browser storage: versioned, per-estimate keys, conflict-safe and fault-tolerant. */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createEstimate, type Estimate } from "@exyconn/gcc-cost";
import {
  backupEstimate,
  estimateKey,
  readBackup,
  readEstimate,
  readIndex,
  removeEstimate,
  saveEstimate,
  setActive,
} from "../../../../src/lib/gcc/storage";
import { DEFAULT_PRESET } from "./preset-fixture";

const NOW = "2026-10-14T10:00:00.000Z";
const make = (name: string): Estimate => createEstimate(DEFAULT_PRESET, name, NOW);

beforeEach(() => localStorage.clear());
afterEach(() => vi.restoreAllMocks());

describe("GCC estimate storage", () => {
  it("saves an estimate under its own key and restores it as the active one", () => {
    const estimate = make("Pune plan");
    expect(saveEstimate(estimate, null)).toEqual({ ok: true });
    expect(readIndex()).toMatchObject({ version: 1, activeId: estimate.id });
    expect(readIndex().entries).toEqual([{ id: estimate.id, name: "Pune plan", updatedAt: NOW }]);
    const read = readEstimate(estimate.id);
    expect(read.ok && read.estimate).toEqual(estimate);
  });

  it("keeps several named estimates and switches between them", () => {
    const first = make("First");
    const second = make("Second");
    saveEstimate(first, null);
    saveEstimate(second, null);
    expect(readIndex().entries.map((entry) => entry.name)).toEqual(["Second", "First"]);
    setActive(first.id);
    expect(readIndex().activeId).toBe(first.id);
  });

  it("refuses to overwrite a copy another tab changed since this tab last saw it", () => {
    const estimate = make("Shared tab");
    saveEstimate(estimate, null);
    const otherTab = { ...estimate, name: "Other tab", updatedAt: "2026-10-14T11:00:00.000Z" };
    saveEstimate(otherTab, NOW);
    const mine = { ...estimate, name: "This tab", updatedAt: "2026-10-14T11:05:00.000Z" };
    expect(saveEstimate(mine, NOW)).toEqual({ ok: false, reason: "conflict" });
    const read = readEstimate(estimate.id);
    expect(read.ok && read.estimate.name).toBe("Other tab");
  });

  it("treats malformed or tampered data as corrupt instead of crashing", () => {
    localStorage.setItem(estimateKey("broken"), "{not json");
    expect(readEstimate("broken")).toEqual({ ok: false, reason: "corrupt" });
    localStorage.setItem(estimateKey("tampered"), JSON.stringify({ ...make("x"), total: 1 }));
    expect(readEstimate("tampered")).toEqual({ ok: false, reason: "corrupt" });
    expect(readEstimate("absent")).toEqual({ ok: false, reason: "missing" });
    localStorage.setItem("exyconn.gcc.v1.index", "[]");
    expect(readIndex()).toEqual({ version: 1, activeId: null, entries: [] });
  });

  it("reports a full storage quota without losing the in-memory estimate", () => {
    const quota = new DOMException("full", "QuotaExceededError");
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw quota;
    });
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    const estimate = make("Too big");
    expect(saveEstimate(estimate, null)).toEqual({ ok: false, reason: "quota" });
    expect(estimate.name).toBe("Too big");
  });

  it("reports other write failures as storage unavailable", () => {
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("SecurityError");
    });
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    expect(saveEstimate(make("Blocked"), null)).toEqual({ ok: false, reason: "unavailable" });
  });

  it("deletes an estimate and its backup, moving the active estimate on", () => {
    const keep = make("Keep");
    const drop = make("Drop");
    saveEstimate(keep, null);
    saveEstimate(drop, null);
    backupEstimate(drop);
    expect(removeEstimate(drop.id)).toEqual({ ok: true });
    expect(readIndex().activeId).toBe(keep.id);
    expect(readEstimate(drop.id)).toEqual({ ok: false, reason: "missing" });
    expect(readBackup(drop.id)).toBeNull();
  });

  it("keeps a validated backup before a replacement", () => {
    const original = make("Before import");
    backupEstimate(original);
    expect(readBackup(original.id)).toEqual(original);
    localStorage.setItem(`exyconn.gcc.v1.backup.${original.id}`, "{bad");
    expect(readBackup(original.id)).toBeNull();
  });
});
