// @vitest-environment jsdom
/** The results step: every breakdown of the open scenario, or a prompt when there is nothing yet. */
import { screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ResultsSection } from "../../../../../../src/components/gcc/calculator/results/ResultsSection";
import { liteEstimate, renderInCalculator } from "../../harness";

vi.mock("../../../../../../src/lib/gcc/api", () => ({}));
vi.mock("../../../../../../src/components/forms/shared/postFormSubmission", () => ({
  fetchCaptcha: vi.fn(),
  postFormSubmission: vi.fn(),
}));

describe("ResultsSection", () => {
  it("shows the headline, breakdowns, timeline, comparison, assumptions and exports", async () => {
    renderInCalculator(<ResultsSection />, { step: "results" });
    expect(
      await screen.findByRole("heading", { name: "Headline figures" }, { timeout: 3000 })
    ).toBeInTheDocument();
    for (const title of [
      "Cost by category",
      "Cost by department",
      "AI and technology breakdown",
      "Operating cost by year",
      "Monthly cost and headcount",
      "Scenario comparison",
      "Download, share and next steps",
    ]) {
      expect(screen.getByRole("heading", { name: title, level: 3 })).toBeInTheDocument();
    }
    const timeline = screen.getByRole("region", { name: "Monthly figures" });
    expect(timeline.tagName).toBe("SECTION");
    expect(within(timeline).getAllByRole("row")).toHaveLength(13);
    expect(screen.getByText("Year 1")).toBeInTheDocument();
  });

  it("reads break-even against the monthly benefit when one is given", async () => {
    const base = liteEstimate();
    const [scenario] = base.scenarios;
    renderInCalculator(<ResultsSection />, {
      estimate: {
        ...base,
        scenarios: [{ ...scenario, assumptions: { ...scenario.assumptions, monthlyBenefit: 1 } }],
      },
    });
    expect(
      await screen.findByText("Not reached in the forecast window", {}, { timeout: 3000 })
    ).toBeInTheDocument();
  });

  it("asks for inputs while there are no valid totals", () => {
    renderInCalculator(<ResultsSection />, { estimate: { ...liteEstimate(), name: "" } });
    expect(
      screen.getByRole("heading", { level: 2, name: "Results & sharing" })
    ).toBeInTheDocument();
    expect(screen.getByText("Add roles or costs to see an estimate.")).toBeInTheDocument();
  });
});
