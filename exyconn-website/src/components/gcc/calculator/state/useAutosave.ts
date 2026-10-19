import { useEffect, useRef } from "react";
import type { UseFormReturn } from "react-hook-form";
import type { Estimate } from "@exyconn/gcc-cost";
import type { LiveEstimate } from "./useLiveEstimate";
import type { EstimateStore } from "./useEstimateStore";

const SAVE_DELAY_MS = 600;

/** Everything but the save stamp, so writing `updatedAt` back into the form never re-saves. */
const snapshot = (estimate: Estimate) => JSON.stringify({ ...estimate, updatedAt: "" });

/**
 * Saves the estimate to this browser a moment after it changes — only valid estimates, so a
 * stored estimate always restores. Invalid input shows "not saved" with the number of problems.
 */
export function useAutosave(
  form: UseFormReturn<Estimate>,
  live: LiveEstimate,
  store: EstimateStore
) {
  const saved = useRef<string | null>(null);
  const { active, persist, saveState, setSaveState } = store;

  useEffect(() => {
    saved.current = active ? snapshot(active) : null;
  }, [active]);

  useEffect(() => {
    const estimate = live.estimate;
    if (!live.valid || !estimate) {
      if (saveState.kind !== "conflict") {
        setSaveState({ kind: "invalid", count: live.issueCount });
      }
      return undefined;
    }
    if (saveState.kind === "conflict") {
      return undefined;
    }
    if (snapshot(estimate) === saved.current) {
      if (saveState.kind === "invalid") {
        setSaveState({ kind: "idle" });
      }
      return undefined;
    }
    setSaveState({ kind: "pending" });
    const timer = globalThis.setTimeout(() => {
      const updatedAt = persist(estimate);
      if (updatedAt) {
        saved.current = snapshot(estimate);
        form.setValue("updatedAt", updatedAt, { shouldDirty: false, shouldValidate: false });
      }
    }, SAVE_DELAY_MS);
    return () => globalThis.clearTimeout(timer);
    // saveState is read, not watched: a status change must not start another save.
  }, [live.estimate, live.valid, live.issueCount]);
}
