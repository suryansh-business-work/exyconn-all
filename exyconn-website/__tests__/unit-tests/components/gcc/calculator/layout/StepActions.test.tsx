// @vitest-environment jsdom
/** Back, Next (checks the step first) and Save, and which fields each step checks. */
import { screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import {
  StepActions,
  stepFields,
} from "../../../../../../src/components/gcc/calculator/layout/StepActions";
import { SECTIONS } from "../../../../../../src/components/gcc/calculator/strings/sections";
import { liteEstimate, renderInCalculator } from "../../harness";

describe("stepFields", () => {
  it("checks the profile's own fields and nothing on the results", () => {
    expect(stepFields("profile", 1)).toEqual([
      "name",
      "company",
      "reportingCurrency",
      "scenarios.1.profile",
      "scenarios.1.assumptions.forecastMonths",
    ]);
    expect(stepFields("people", 0)).toEqual(["scenarios.0.roles"]);
    expect(stepFields("results", 0)).toEqual([]);
    for (const section of SECTIONS) {
      expect(Array.isArray(stepFields(section.id, 0))).toBe(true);
    }
  });
});

describe("StepActions", () => {
  it("goes back and forward between steps", async () => {
    const goTo = vi.fn();
    const { user } = renderInCalculator(<StepActions />, { step: "office", goTo });
    await user.click(screen.getByRole("button", { name: "Back" }));
    expect(goTo).toHaveBeenLastCalledWith("profile");
    await user.click(screen.getByRole("button", { name: "Next" }));
    await waitFor(() => expect(goTo).toHaveBeenLastCalledWith("people"));
    expect(screen.queryByText("Some fields in this section need attention.")).toBeNull();
  });

  it("cannot go back from the first step, and names the last Next", () => {
    renderInCalculator(<StepActions />, { step: "profile" });
    expect(screen.getByRole("button", { name: "Back" })).toBeDisabled();
    renderInCalculator(<StepActions />, { step: "assumptions" });
    expect(screen.getByRole("button", { name: "See results" })).toBeInTheDocument();
  });

  it("has no Next on the results", () => {
    renderInCalculator(<StepActions />, { step: "results" });
    expect(screen.queryByRole("button", { name: /Next|See results/ })).toBeNull();
  });

  it("stays on a step with an invalid field and says so", async () => {
    const goTo = vi.fn();
    const { user } = renderInCalculator(<StepActions />, {
      step: "profile",
      goTo,
      estimate: { ...liteEstimate(), name: "" },
    });
    await user.click(screen.getByRole("button", { name: "Next" }));
    expect(
      await screen.findByText("Some fields in this section need attention.")
    ).toBeInTheDocument();
    expect(goTo).not.toHaveBeenCalled();
  });

  it("saves now and stamps the form with the save time", async () => {
    const { user, store, form } = renderInCalculator(<StepActions />);
    await user.click(screen.getByRole("button", { name: "Save" }));
    await waitFor(() => expect(store.persist).toHaveBeenCalledTimes(1));
    expect(form.current?.getValues("updatedAt")).toBe("2026-10-14T00:00:00.000Z");
  });

  it("keeps the stamp when the save fails, and saves nothing invalid", async () => {
    const failing = renderInCalculator(<StepActions />, { store: { persist: vi.fn(() => null) } });
    failing.form.current?.setValue("updatedAt", "2026-10-13T00:00:00.000Z");
    await failing.user.click(screen.getByRole("button", { name: "Save" }));
    await waitFor(() => expect(failing.store.persist).toHaveBeenCalledTimes(1));
    expect(failing.form.current?.getValues("updatedAt")).toBe("2026-10-13T00:00:00.000Z");
    failing.unmount();

    const invalid = renderInCalculator(<StepActions />, {
      estimate: { ...liteEstimate(), name: "" },
    });
    await invalid.user.click(screen.getByRole("button", { name: "Save" }));
    await new Promise((resolve) => setTimeout(resolve, 100));
    expect(invalid.store.persist).not.toHaveBeenCalled();
  });
});
