// @vitest-environment jsdom
/** The comparison table: one column per scenario, differences from the baseline with their sign. */
import { screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { ScenarioComparison as Comparison } from "@exyconn/gcc-cost";
import { ScenarioComparison } from "../../../../../../src/components/gcc/calculator/results/ScenarioComparison";
import { liteEstimate, renderInCalculator } from "../../harness";

const compared = vi.hoisted(() => ({ value: null as Comparison[] | null }));
vi.mock("@exyconn/gcc-cost", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@exyconn/gcc-cost")>();
  return {
    ...actual,
    compareScenarios: (outcomes: Parameters<typeof actual.compareScenarios>[0]) =>
      compared.value ?? actual.compareScenarios(outcomes),
  };
});

const row = (name: string) => screen.getByRole("rowheader", { name }).closest("tr") as HTMLElement;

describe("ScenarioComparison", () => {
  it("is a focusable, named scroll region with the baseline marked", async () => {
    compared.value = null;
    renderInCalculator(<ScenarioComparison />);
    const region = await screen.findByRole("region", { name: "Scenario comparison" });
    expect(region.tagName).toBe("SECTION");
    expect(region).toHaveAttribute("tabindex", "0");
    expect(await within(region).findByText(/· Baseline/)).toBeInTheDocument();
  });

  it("signs increases, shows decreases as they are, and leaves out what cannot be compared", async () => {
    compared.value = [
      {
        scenarioId: "base",
        name: "Standard",
        variances: [
          { metric: "setupCost", value: 100_00, delta: 0, deltaPct: 0 },
          { metric: "costPerEmployeeMonthly", value: null, delta: null, deltaPct: null },
          { metric: "deposits", value: 0, delta: 0, deltaPct: null },
        ],
      },
      {
        scenarioId: "lean",
        name: "Lean",
        variances: [
          { metric: "setupCost", value: 150_00, delta: 50_00, deltaPct: 50 },
          { metric: "costPerEmployeeMonthly", value: 10_00, delta: null, deltaPct: null },
          { metric: "deposits", value: -5_00, delta: -5_00, deltaPct: null },
        ],
      },
    ];
    renderInCalculator(<ScenarioComparison />, { locale: "en-IN" });
    const setup = within(row("One-time setup")).getAllByRole("cell");
    expect(setup[0]).not.toHaveTextContent("+");
    expect(setup[1].querySelector(".gcc-compare__delta")).toHaveTextContent(/^\+₹50 \(\+50%\)$/);
    const perEmployee = within(row("Cost per employee / month")).getAllByRole("cell");
    expect(perEmployee[0]).toHaveTextContent("—");
    expect(perEmployee[1].querySelector(".gcc-compare__delta")).toBeEmptyDOMElement();
    const deposits = within(row("Refundable deposits")).getAllByRole("cell");
    expect(deposits[1].querySelector(".gcc-compare__delta")).toHaveTextContent(/^-₹5$/);
  });

  it("has no rows when there is nothing to compare", () => {
    compared.value = [];
    renderInCalculator(<ScenarioComparison />, { estimate: { ...liteEstimate(), name: "" } });
    expect(screen.queryAllByRole("rowheader")).toHaveLength(0);
  });
});
