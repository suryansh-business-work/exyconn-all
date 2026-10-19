// @vitest-environment jsdom
/** The estimate bar: switch estimate or scenario, the estimate actions, notices and the preset offer. */
import { screen, waitFor, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { EstimateBar } from "../../../../../../src/components/gcc/calculator/layout/EstimateBar";
import { DEFAULT_PRESET } from "../../../../lib/gcc/preset-fixture";
import { liteEstimate, renderInCalculator } from "../../harness";

const openAction = async (user: ReturnType<typeof renderInCalculator>["user"], name: string) => {
  await user.click(screen.getByRole("button", { name: "Estimate actions" }));
  await user.click(await screen.findByRole("menuitem", { name }));
};

/** Lets the live totals settle (they recompute a moment after each change). */
const settle = () => new Promise((resolve) => setTimeout(resolve, 200));

const named = async (
  user: ReturnType<typeof renderInCalculator>["user"],
  title: string,
  value?: string
) => {
  const dialog = await screen.findByRole("dialog", { name: title });
  const field = within(dialog).getByRole("textbox", { name: "Estimate name" });
  if (value !== undefined) {
    await user.clear(field);
    await user.type(field, value);
  }
  return { dialog, field };
};

describe("EstimateBar", () => {
  it("lists the saved estimates and opens the one picked", async () => {
    const estimate = liteEstimate();
    const { user, store } = renderInCalculator(<EstimateBar />, {
      estimate,
      store: {
        entries: [
          { id: estimate.id, name: "Pune GCC", updatedAt: estimate.updatedAt },
          { id: "other", name: "Chennai GCC", updatedAt: estimate.updatedAt },
        ],
      },
    });
    expect(screen.getByRole("region", { name: "Estimate" })).toHaveTextContent(
      /saved in this browser only/
    );
    await user.click(screen.getByRole("combobox", { name: "Estimate" }));
    await user.click(await screen.findByRole("option", { name: "Chennai GCC" }));
    expect(store.open).toHaveBeenCalledWith("other");
  });

  it("switches the scenario being edited", async () => {
    const base = liteEstimate();
    const second = { ...base.scenarios[0], id: "extra", name: "Extra scenario" };
    const { user, form } = renderInCalculator(<EstimateBar />, {
      estimate: { ...base, scenarios: [...base.scenarios, second] },
    });
    await user.click(screen.getByRole("combobox", { name: "Scenario" }));
    await user.click(await screen.findByRole("option", { name: second.name }));
    expect(form.current?.getValues("activeScenarioId")).toBe(second.id);
  });

  it("creates a new estimate under the name given", async () => {
    const { user, store } = renderInCalculator(<EstimateBar />);
    await openAction(user, "New estimate");
    const { dialog, field } = await named(user, "New estimate");
    await waitFor(() => expect(field).toHaveValue("My GCC estimate"));
    await user.click(within(dialog).getByRole("button", { name: "New estimate" }));
    expect(store.create).toHaveBeenCalledWith("My GCC estimate");
  });

  it("renames the open estimate in the form", async () => {
    const { user, form } = renderInCalculator(<EstimateBar />);
    await openAction(user, "Rename");
    const { dialog } = await named(user, "Rename", "Pune GCC v2");
    await user.click(within(dialog).getByRole("button", { name: "Rename" }));
    expect(form.current?.getValues("name")).toBe("Pune GCC v2");
  });

  it("duplicates the live estimate under a copy name", async () => {
    const { user, store } = renderInCalculator(<EstimateBar />);
    await settle();
    await openAction(user, "Duplicate estimate");
    const { dialog, field } = await named(user, "Duplicate estimate");
    await waitFor(() => expect(field).toHaveValue("Pune GCC (copy)"));
    await user.click(within(dialog).getByRole("button", { name: "Duplicate estimate" }));
    expect(store.duplicate).toHaveBeenCalledWith(
      expect.objectContaining({ name: "Pune GCC" }),
      "Pune GCC (copy)"
    );
  });

  it("duplicates the stored estimate while the form is invalid, and nothing without one", async () => {
    const stored = liteEstimate("Stored");
    const invalid = { ...liteEstimate(), name: "" };
    const first = renderInCalculator(<EstimateBar />, {
      estimate: invalid,
      store: { active: stored },
    });
    await openAction(first.user, "Duplicate estimate");
    let { dialog } = await named(first.user, "Duplicate estimate", "Copy");
    await first.user.click(within(dialog).getByRole("button", { name: "Duplicate estimate" }));
    expect(first.store.duplicate).toHaveBeenCalledWith(stored, "Copy");
    first.unmount();

    const second = renderInCalculator(<EstimateBar />, {
      estimate: invalid,
      store: { active: null },
    });
    await openAction(second.user, "Duplicate estimate");
    ({ dialog } = await named(second.user, "Duplicate estimate", "Copy"));
    await second.user.click(within(dialog).getByRole("button", { name: "Duplicate estimate" }));
    expect(second.store.duplicate).not.toHaveBeenCalled();
  });

  it("deletes the open estimate after confirmation", async () => {
    const { user, store, estimate } = renderInCalculator(<EstimateBar />);
    await openAction(user, "Delete estimate");
    const dialog = await screen.findByRole("dialog", { name: "Delete estimate" });
    expect(dialog).toHaveTextContent("Delete “Pune GCC” from this browser?");
    await user.click(within(dialog).getByRole("button", { name: "Delete" }));
    expect(store.remove).toHaveBeenCalledWith(estimate.id);
  });

  it.each([
    ["valid", liteEstimate()],
    ["invalid", { ...liteEstimate(), name: "" }],
  ])(
    "resets a %s estimate to the preset's defaults, keeping its name",
    async (_state, estimate) => {
      const { user, store } = renderInCalculator(<EstimateBar />, { estimate });
      await settle();
      await openAction(user, "Reset to defaults");
      const dialog = await screen.findByRole("dialog", { name: "Reset to defaults" });
      await user.click(within(dialog).getByRole("button", { name: "Reset" }));
      const [current, fresh] = vi.mocked(store.replaceActive).mock.calls[0];
      expect(current.id).toBe(estimate.id);
      expect(fresh.name).toBe(estimate.name);
      expect(fresh.scenarios.map((scenario) => scenario.id)).toEqual(
        DEFAULT_PRESET.scenarios.map((s) => s.id)
      );
    }
  );

  it("shows a storage notice the visitor can dismiss", async () => {
    const { user, store } = renderInCalculator(<EstimateBar />, {
      store: { notice: "A saved estimate was not found in this browser." },
    });
    const alert = screen.getByRole("alert");
    expect(alert).toHaveTextContent("A saved estimate was not found");
    await user.click(within(alert).getByRole("button", { name: "Close" }));
    expect(store.dismissNotice).toHaveBeenCalledTimes(1);
  });

  it("offers a new estimate from the preset a link named, or lets it be dismissed", async () => {
    const offered = DEFAULT_PRESET.scenarios[1];
    const { user, store } = renderInCalculator(<EstimateBar />, {
      store: { presetOffer: offered.id },
    });
    const alert = screen.getByRole("alert");
    expect(alert).toHaveTextContent(`You opened the calculator with the ${offered.name} preset.`);
    await user.click(within(alert).getByRole("button", { name: "Start a new estimate from it" }));
    expect(store.dismissPresetOffer).toHaveBeenCalledTimes(1);
    expect(store.create).toHaveBeenCalledWith(`${offered.name} estimate`, offered.id);
    await user.click(within(alert).getByRole("button", { name: "Close" }));
    expect(store.dismissPresetOffer).toHaveBeenCalledTimes(2);
  });

  it("closes the actions menu with Escape without running anything", async () => {
    const { user, store } = renderInCalculator(<EstimateBar />);
    const button = screen.getByRole("button", { name: "Estimate actions" });
    await user.click(button);
    expect(button).toHaveAttribute("aria-expanded", "true");
    await user.keyboard("{Escape}");
    await waitFor(() => expect(button).not.toHaveAttribute("aria-expanded"));
    expect(store.create).not.toHaveBeenCalled();
  });

  it("offers nothing for a preset scenario that does not exist", () => {
    renderInCalculator(<EstimateBar />, { store: { presetOffer: "unknown" } });
    expect(screen.queryByRole("alert")).toBeNull();
  });
});
