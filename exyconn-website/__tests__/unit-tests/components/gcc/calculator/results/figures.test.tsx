// @vitest-environment jsdom
/** The results' building blocks: headline cards, bars, assumptions and the printable report. */
import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import {
  buildReport,
  calculateEstimate,
  type ReportModel,
  type ScenarioSummary,
} from "@exyconn/gcc-cost";
import { BarList } from "../../../../../../src/components/gcc/calculator/charts/BarList";
import { AssumptionsPanel } from "../../../../../../src/components/gcc/calculator/results/AssumptionsPanel";
import { HeadlineFigures } from "../../../../../../src/components/gcc/calculator/results/HeadlineFigures";
import { ReportBody } from "../../../../../../src/components/gcc/calculator/results/ReportBody";
import { liteEstimate, renderInCalculator } from "../../harness";

const estimate = liteEstimate();
const [outcome] = calculateEstimate(estimate);
const summary = (extra: Partial<ScenarioSummary> = {}): ScenarioSummary => ({
  ...outcome.summary,
  ...extra,
});
const card = (label: string) => {
  const term = screen.getByText(label, { selector: "dt" });
  return term.nextElementSibling?.textContent;
};

describe("HeadlineFigures", () => {
  it("shows every card, the forecast total as the lead, and each horizon", () => {
    renderInCalculator(<HeadlineFigures summary={summary()} hasBenefit={false} />, { estimate });
    expect(screen.getByText("Forecast total", { selector: "dt" }).parentElement).toHaveClass(
      "gcc-metric--lead"
    );
    expect(card("One-time setup")).toMatch(/₹/);
    for (const horizon of outcome.summary.horizonTotals) {
      expect(screen.getByText(`${horizon.months} months`)).toBeInTheDocument();
    }
  });

  it.each([
    [{ breakEvenMonth: 14 }, false, "Month 14"],
    [{ breakEvenMonth: null }, true, "Not reached in the forecast window"],
    [
      { breakEvenMonth: null },
      false,
      "Add a monthly benefit in Forecast & assumptions to calculate it",
    ],
  ])("reads break-even %o (benefit given: %s) as %j", (extra, hasBenefit, text) => {
    renderInCalculator(<HeadlineFigures summary={summary(extra)} hasBenefit={hasBenefit} />, {
      estimate,
    });
    expect(card("Break-even")).toBe(text);
  });

  it("shows a dash without staff and None without a discount rate, else the amounts", () => {
    const { unmount } = renderInCalculator(
      <HeadlineFigures
        summary={summary({ costPerEmployeeMonthly: null, presentValue: null })}
        hasBenefit={false}
      />,
      { estimate }
    );
    expect(card("Cost per employee / month")).toBe("—");
    expect(card("Present value of forecast")).toBe("None");
    unmount();
    renderInCalculator(
      <HeadlineFigures
        summary={summary({ costPerEmployeeMonthly: 1_000_00, presentValue: 5_000_00 })}
        hasBenefit={false}
      />,
      { estimate }
    );
    expect(card("Cost per employee / month")).toMatch(/1,000/);
    expect(card("Present value of forecast")).toMatch(/5,000/);
  });
});

describe("BarList", () => {
  const format = (minor: number) => `₹${minor / 100}`;

  it("draws positive values against the largest, in the given tone", () => {
    const { container } = render(
      <BarList
        bars={[
          { key: "a", label: "Payroll", value: 400 },
          { key: "b", label: "Office", value: 100 },
          { key: "c", label: "Legal", value: 0 },
        ]}
        format={format}
        empty="Nothing yet"
        tone="night"
      />
    );
    expect(container.querySelector("dl")).toHaveClass("gcc-bars--night");
    expect(screen.queryByText("Legal")).toBeNull();
    const fills = container.querySelectorAll<HTMLElement>(".gcc-bars__fill");
    expect([...fills].map((fill) => fill.style.inlineSize)).toEqual(["100%", "25%"]);
    expect(screen.getByText("₹4")).toBeInTheDocument();
  });

  it("uses the light tone by default and says so when nothing is above zero", () => {
    const { container, rerender } = render(
      <BarList bars={[{ key: "a", label: "Payroll", value: 1 }]} format={format} empty="Nothing" />
    );
    expect(container.querySelector("dl")).toHaveClass("gcc-bars--light");
    rerender(<BarList bars={[]} format={format} empty="Nothing yet" />);
    expect(screen.getByText("Nothing yet")).toHaveClass("gcc-empty");
  });
});

describe("AssumptionsPanel", () => {
  it("lists review and illustrative items, or None", () => {
    const { unmount } = render(
      <AssumptionsPanel
        summary={summary({ reviewItems: ["Transfer pricing"], illustrativeItems: [] })}
      />
    );
    const review = screen.getByRole("heading", { name: "Items requiring professional review" });
    expect(review.parentElement).toHaveTextContent("Transfer pricing");
    const illustrative = screen.getByRole("heading", {
      name: "Items based on illustrative assumptions",
    });
    expect(within(illustrative.parentElement as HTMLElement).getByText("None")).toBeInTheDocument();
    expect(screen.getByText(/Deposits are refundable/)).toBeInTheDocument();
    unmount();
  });
});

describe("ReportBody", () => {
  const report: ReportModel = buildReport(estimate, [outcome], {
    locale: "en-IN",
    display: "code",
    generatedOn: "14 Oct 2026",
  });

  it("prints the title, the tables that have rows, review items and issues", () => {
    const [scenario] = report.scenarios;
    render(
      <ReportBody
        report={{
          ...report,
          company: [],
          scenarios: [
            {
              ...scenario,
              reviewItems: ["Transfer pricing", "GST"],
              issues: ["No rate for USD"],
            },
          ],
        }}
      />
    );
    expect(screen.getByRole("heading", { level: 2, name: estimate.name })).toBeInTheDocument();
    expect(screen.getByText(/14 Oct 2026 · INR/)).toBeInTheDocument();
    expect(screen.queryByText("Company and exchange rates")).toBeNull();
    expect(screen.getByRole("table", { name: "Cost summary" })).toBeInTheDocument();
    expect(
      screen.getByText("Requires professional review: Transfer pricing, GST")
    ).toBeInTheDocument();
    expect(screen.getByText("No rate for USD")).toBeInTheDocument();
    expect(screen.getByText(report.disclaimer)).toBeInTheDocument();
  });

  it("leaves out the review line when nothing needs review", () => {
    const [scenario] = report.scenarios;
    render(
      <ReportBody
        report={{
          ...report,
          company: [{ label: "Company", value: "Acme" }],
          scenarios: [{ ...scenario, reviewItems: [] }],
        }}
      />
    );
    expect(screen.queryByText(/Requires professional review/)).toBeNull();
    expect(screen.getByRole("table", { name: "Company and exchange rates" })).toBeInTheDocument();
  });
});
