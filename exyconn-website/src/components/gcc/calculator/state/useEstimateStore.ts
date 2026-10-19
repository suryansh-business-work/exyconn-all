import { useCallback, useEffect, useRef, useState } from "react";
import {
  createEstimate,
  duplicateEstimate,
  type CalculatorPreset,
  type Estimate,
} from "@exyconn/gcc-cost";
import {
  backupEstimate,
  estimateKey,
  readEstimate,
  readIndex,
  removeEstimate,
  saveEstimate,
  setActive,
  type IndexEntry,
} from "../../../../lib/gcc/storage";
import { UI } from "../strings/ui";

export type SaveState =
  | { kind: "idle" }
  | { kind: "pending" }
  | { kind: "saved"; at: string }
  | { kind: "invalid"; count: number }
  | { kind: "error"; reason: "unavailable" | "quota" }
  | { kind: "conflict" };

const now = () => new Date().toISOString();

/** Picks the scenario a `?preset=` link asks for, when the preset has it. */
function withScenario(estimate: Estimate, scenarioId: string | null): Estimate {
  const known = estimate.scenarios.some((scenario) => scenario.id === scenarioId);
  return known && scenarioId ? { ...estimate, activeScenarioId: scenarioId } : estimate;
}

/**
 * The estimates saved in this browser and the one being edited. Every write goes to the
 * estimate's own key and only when the stored copy is the one this tab last saw; if another tab
 * changed it, saving stops and the person chooses which version to keep.
 */
export function useEstimateStore(preset: CalculatorPreset, presetScenario: string | null) {
  const [entries, setEntries] = useState<IndexEntry[]>([]);
  const [activeEstimate, setActiveEstimate] = useState<Estimate | null>(null);
  const [saveState, setSaveState] = useState<SaveState>({ kind: "idle" });
  const [notice, setNotice] = useState<string | null>(null);
  /** A `?preset=` scenario still on offer: cleared once used or dismissed. */
  const [presetOffer, setPresetOffer] = useState<string | null>(presetScenario);
  /** Bumped whenever a stored estimate is (re)loaded, so the form starts again from it. */
  const [revision, setRevision] = useState(0);
  const base = useRef<string | null>(null);

  const refreshEntries = useCallback(() => setEntries(readIndex().entries), []);

  const show = useCallback(
    (estimate: Estimate) => {
      base.current = estimate.updatedAt;
      setActiveEstimate(estimate);
      setRevision((value) => value + 1);
      setSaveState({ kind: "idle" });
      setActive(estimate.id);
      refreshEntries();
    },
    [refreshEntries]
  );

  /** Saves a new estimate and opens it; when storage fails it still opens, in memory only. */
  const adopt = useCallback(
    (estimate: Estimate) => {
      const result = saveEstimate(estimate, null);
      show(estimate);
      if (!result.ok) {
        setSaveState({
          kind: "error",
          reason: result.reason === "quota" ? "quota" : "unavailable",
        });
      }
    },
    [show]
  );

  const create = useCallback(
    (name: string, scenarioId: string | null = null) =>
      adopt(withScenario(createEstimate(preset, name, now()), scenarioId)),
    [adopt, preset]
  );

  const open = useCallback(
    (id: string) => {
      const read = readEstimate(id);
      if (read.ok) {
        show(read.estimate);
        return true;
      }
      setNotice(read.reason === "corrupt" ? UI.store.corrupt : UI.store.missing);
      return false;
    },
    [show]
  );

  useEffect(() => {
    const index = readIndex();
    const order = [index.activeId, ...index.entries.map((entry) => entry.id)].filter(
      (id): id is string => Boolean(id)
    );
    if (!order.some((id) => open(id))) {
      create(UI.store.defaultName, presetScenario);
      setPresetOffer(null);
    }
    // Runs once: the stored estimates are read when the calculator mounts.
  }, []);

  /** Writes the edited estimate; returns its new `updatedAt`, or null when nothing was saved. */
  const persist = useCallback((estimate: Estimate): string | null => {
    const stamped = { ...estimate, updatedAt: now() };
    const result = saveEstimate(stamped, base.current);
    if (result.ok) {
      base.current = stamped.updatedAt;
      setSaveState({ kind: "saved", at: stamped.updatedAt });
      setEntries(readIndex().entries);
      return stamped.updatedAt;
    }
    setSaveState(
      result.reason === "conflict" ? { kind: "conflict" } : { kind: "error", reason: result.reason }
    );
    return null;
  }, []);

  /** Another tab saved the open estimate: stop saving until the person decides. */
  useEffect(() => {
    const onStorage = (event: StorageEvent) => {
      if (
        activeEstimate &&
        event.key === estimateKey(activeEstimate.id) &&
        event.newValue !== null
      ) {
        setSaveState({ kind: "conflict" });
      }
      refreshEntries();
    };
    globalThis.addEventListener("storage", onStorage);
    return () => globalThis.removeEventListener("storage", onStorage);
  }, [activeEstimate, refreshEntries]);

  const keepTheirs = useCallback(() => {
    if (activeEstimate) {
      open(activeEstimate.id);
    }
  }, [activeEstimate, open]);

  /** Keeps this tab's version: adopt the stored version's stamp so the next save overwrites it. */
  const keepMine = useCallback(
    (estimate: Estimate) => {
      const stored = readEstimate(estimate.id);
      base.current = stored.ok ? stored.estimate.updatedAt : null;
      persist(estimate);
    },
    [persist]
  );

  const remove = useCallback(
    (id: string) => {
      removeEstimate(id);
      const next = readIndex().entries[0];
      if (!next || !open(next.id)) {
        create(UI.store.defaultName);
      }
    },
    [create, open]
  );

  const duplicate = useCallback(
    (estimate: Estimate, name: string) => adopt(duplicateEstimate(estimate, name, now())),
    [adopt]
  );

  /** Replaces the open estimate with an imported one, keeping a backup of what it replaces. */
  const replaceActive = useCallback(
    (current: Estimate, incoming: Estimate) => {
      backupEstimate(current);
      const replacement = {
        ...incoming,
        id: current.id,
        createdAt: current.createdAt,
        updatedAt: now(),
      };
      const result = saveEstimate(replacement, base.current);
      show(replacement);
      if (!result.ok) {
        setSaveState(
          result.reason === "conflict"
            ? { kind: "conflict" }
            : { kind: "error", reason: result.reason }
        );
      }
    },
    [show]
  );

  return {
    entries,
    active: activeEstimate,
    revision,
    presetOffer,
    dismissPresetOffer: () => setPresetOffer(null),
    saveState,
    setSaveState,
    notice,
    dismissNotice: () => setNotice(null),
    create,
    open,
    persist,
    keepTheirs,
    keepMine,
    remove,
    duplicate,
    importAsNew: (estimate: Estimate) => duplicate(estimate, estimate.name),
    replaceActive,
  };
}

export type EstimateStore = ReturnType<typeof useEstimateStore>;
