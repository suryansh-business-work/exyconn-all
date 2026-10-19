// @vitest-environment jsdom
/** The live summary beside the form, and the step navigation above it. */
import { screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { SectionNav } from "../../../../../../src/components/gcc/calculator/layout/SectionNav";
import {
  SummarySidebar,
  sectionBars,
} from "../../../../../../src/components/gcc/calculator/layout/SummarySidebar";
import { calculateEstimate } from "@exyconn/gcc-cost";
import { liteEstimate, renderInCalculator } from "../../harness";

vi.mock("../../../../../../src/lib/gcc/api", () => ({
  fetchCurrencies: vi.fn().mockResolvedValue({ ok: false, reason: "unavailable", message: "" }),
  fetchFxRates: vi.fn(),
}));

describe("sectionBars", () => {
  it("totals every group of a cost section", () => {
    const [{ summary }] = calculateEstimate(liteEstimate());
    const bars = sectionBars(summary);
    const payroll = bars.find((bar) => bar.key === "payroll");
    expect(payroll?.label).toBe("Payroll");
    expect(payroll?.value).toBe(
      summary.byGroup
        .filter((group) => group.section === "payroll")
        .reduce((sum, group) => sum + group.total, 0)
    );
  });
});

describe("SummarySidebar", () => {
  it("shows the forecast and its figures for the open scenario", async () => {
    const { user } = renderInCalculator(<SummarySidebar />);
    const aside = await screen.findByRole("complementary", { name: "Estimate summary" });
    expect(aside).toHaveTextContent("Forecast total");
    expect(aside).toHaveTextContent(/12-month forecast/);
    expect(
      within(aside).getByRole("link", { name: "Rates by Exchange Rate API" })
    ).toBeInTheDocument();
    expect(within(aside).queryByText("Totals reflect the last valid inputs.")).toBeNull();
    await user.click(within(aside).getByRole("button", { name: "Cost breakdown" }));
    expect(await within(aside).findByText("Payroll")).toBeInTheDocument();
  });

  it("falls back to the first scenario, and shows a dash without staff", async () => {
    const base = liteEstimate();
    const [scenario] = base.scenarios;
    renderInCalculator(<SummarySidebar />, {
      scenarioIndex: 3,
      estimate: { ...base, scenarios: [{ ...scenario, roles: [] }] },
    });
    const aside = await screen.findByRole("complementary", { name: "Estimate summary" });
    const perEmployee = within(aside).getByText("Cost per employee / month");
    expect(perEmployee.nextElementSibling).toHaveTextContent("—");
  });

  it("warns about prices in a currency without a rate", async () => {
    const base = liteEstimate();
    const [scenario] = base.scenarios;
    const line = { ...scenario.lines[0], currency: "USD" };
    renderInCalculator(<SummarySidebar />, {
      estimate: {
        ...base,
        scenarios: [{ ...scenario, lines: [line, ...scenario.lines.slice(1)] }],
      },
    });
    expect(await screen.findByText(/Add an exchange rate for USD/)).toBeInTheDocument();
  });

  it("marks totals stale while an input is invalid, and shows nothing before any valid input", async () => {
    const { form } = renderInCalculator(<SummarySidebar />);
    await screen.findByRole("complementary", { name: "Estimate summary" });
    form.current?.setValue("name", "");
    expect(await screen.findByText("Totals reflect the last valid inputs.")).toBeInTheDocument();

    const { container } = renderInCalculator(<SummarySidebar />, {
      estimate: { ...liteEstimate(), name: "" },
    });
    expect(container).toBeEmptyDOMElement();
  });
});

describe("SectionNav", () => {
  it("shows progress, marks the current step and moves to any step", async () => {
    const goTo = vi.fn();
    const { user } = renderInCalculator(<SectionNav />, { step: "people", goTo });
    const nav = screen.getByRole("navigation", { name: "Calculator sections" });
    expect(within(nav).getAllByText("Step 3 of 10")[0]).toBeInTheDocument();
    expect(within(nav).getByRole("button", { name: /Employees & payroll/ })).toHaveAttribute(
      "aria-current",
      "step"
    );
    await user.click(within(nav).getByRole("button", { name: /Results & sharing/ }));
    expect(goTo).toHaveBeenCalledWith("results");
  });
});
