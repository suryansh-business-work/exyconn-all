// @vitest-environment jsdom
/** Autosave: saves valid changes a moment later, reports invalid input, and holds off in a conflict. */
import { act, waitFor } from "@testing-library/react";
import { useFormContext } from "react-hook-form";
import { describe, expect, it, vi } from "vitest";
import type { Estimate } from "@exyconn/gcc-cost";
import { useCalculator } from "../../../../../../src/components/gcc/calculator/state/CalculatorContext";
import { useAutosave } from "../../../../../../src/components/gcc/calculator/state/useAutosave";
import type { SaveState } from "../../../../../../src/components/gcc/calculator/state/useEstimateStore";
import { NOW, liteEstimate, renderInCalculator } from "../../harness";

function Autosave() {
  const { live, store } = useCalculator();
  useAutosave(useFormContext<Estimate>(), live, store);
  return null;
}

const SAVED_AT = "2026-10-14T10:00:00.000Z";

function start(options: { saveState?: SaveState; estimate?: Estimate; stored?: Estimate | null }) {
  const estimate = options.estimate ?? liteEstimate();
  return renderInCalculator(<Autosave />, {
    estimate,
    store: {
      active: options.stored === undefined ? estimate : options.stored,
      saveState: options.saveState ?? { kind: "idle" },
      persist: vi.fn(() => SAVED_AT),
    },
  });
}

describe("useAutosave", () => {
  it("saves a change a moment later and writes the save stamp back into the form", async () => {
    const { form, store } = start({});
    act(() => form.current?.setValue("name", "Renamed"));
    await waitFor(() => expect(store.setSaveState).toHaveBeenCalledWith({ kind: "pending" }));
    await waitFor(() => expect(store.persist).toHaveBeenCalledTimes(1), { timeout: 3000 });
    expect(store.persist).toHaveBeenCalledWith(expect.objectContaining({ name: "Renamed" }));
    await waitFor(() => expect(form.current?.getValues("updatedAt")).toBe(SAVED_AT));
  });

  it("saves a new estimate that this browser has not stored yet", async () => {
    const { store } = start({ stored: null });
    await waitFor(() => expect(store.persist).toHaveBeenCalledTimes(1), { timeout: 3000 });
  });

  it("keeps the old stamp when the save fails", async () => {
    const { form, store } = start({});
    vi.mocked(store.persist).mockReturnValue(null);
    act(() => form.current?.setValue("name", "Renamed"));
    await waitFor(() => expect(store.persist).toHaveBeenCalled(), { timeout: 3000 });
    expect(form.current?.getValues("updatedAt")).toBe(NOW);
  });

  it("does not save what is already stored", async () => {
    const { store } = start({});
    await new Promise((resolve) => setTimeout(resolve, 900));
    expect(store.persist).not.toHaveBeenCalled();
    expect(store.setSaveState).not.toHaveBeenCalled();
  });

  it("clears the not-saved notice once the input is back to what is stored", async () => {
    const { store } = start({ saveState: { kind: "invalid", count: 1 } });
    await waitFor(() => expect(store.setSaveState).toHaveBeenCalledWith({ kind: "idle" }));
    expect(store.persist).not.toHaveBeenCalled();
  });

  it("reports how many fields need fixing and saves nothing", async () => {
    const { store } = start({ estimate: { ...liteEstimate(), name: "" } });
    await waitFor(() =>
      expect(store.setSaveState).toHaveBeenCalledWith({ kind: "invalid", count: 1 })
    );
    expect(store.persist).not.toHaveBeenCalled();
  });

  it("stays out of the way while another tab's change is unresolved", async () => {
    const valid = start({ saveState: { kind: "conflict" } });
    act(() => valid.form.current?.setValue("name", "Renamed"));
    await new Promise((resolve) => setTimeout(resolve, 900));
    expect(valid.store.persist).not.toHaveBeenCalled();
    expect(valid.store.setSaveState).not.toHaveBeenCalled();
    valid.unmount();

    const invalid = start({
      saveState: { kind: "conflict" },
      estimate: { ...liteEstimate(), name: "" },
    });
    await new Promise((resolve) => setTimeout(resolve, 300));
    expect(invalid.store.setSaveState).not.toHaveBeenCalled();
  });
});
