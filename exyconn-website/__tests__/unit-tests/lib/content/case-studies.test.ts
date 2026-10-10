/** Case-study metrics pulled from a story's own words, and the terrain scene built from them. */
import { describe, expect, it } from "vitest";
import {
  extractMetrics,
  listTerrain,
  storyMetrics,
  storyTerrain,
} from "../../../../src/lib/content/case-studies";
import { caseStudy } from "../cms/fixtures";

const FLAT = [0, 0, 0, 0, 0, 0, 0, 0];

describe("extractMetrics", () => {
  it("finds nothing in a number that has no unit, even at the very end of the text", () => {
    expect(extractMetrics("Headcount grew to 40")).toEqual([]);
    expect(extractMetrics("Headcount grew to 40.")).toEqual([]);
  });

  it("collapses the extra spaces left where the number and its preposition were", () => {
    expect(extractMetrics("Cutting triage time  by 62%")).toEqual([
      { value: "62%", amount: 62, label: "Cutting triage time" },
    ]);
  });

  it("reads percentages and multipliers with the clause that states them", () => {
    expect(
      extractMetrics("Cut triage time by 62%. Applications rose 3x, costs fell 1,200.5 × overall")
    ).toEqual([
      { value: "62%", amount: 62, label: "Cut triage time" },
      { value: "3x", amount: 3, label: "Applications rose" },
      { value: "1,200.5x", amount: 1200.5, label: "Costs fell overall" },
    ]);
  });

  it("drops a trailing full stop and preposition from the label", () => {
    expect(extractMetrics("revenue grew by 40%.")).toEqual([
      { value: "40%", amount: 40, label: "Revenue grew" },
    ]);
    expect(extractMetrics("Uptime 99.9% while costs dropped")[0]).toEqual({
      value: "99.9%",
      amount: 99.9,
      label: "Uptime",
    });
  });

  it("finds nothing in a text without numbers or units", () => {
    expect(extractMetrics("No numbers here.")).toEqual([]);
    expect(extractMetrics("We hired 12 people")).toEqual([]);
  });

  it("keeps at most `max` metrics, four by default", () => {
    const text = "a 1%, b 2%, c 3%, d 4%, e 5%";
    expect(extractMetrics(text)).toHaveLength(4);
    expect(extractMetrics(text, 2).map((m) => m.amount)).toEqual([1, 2]);
  });

  it("clips a long label with an ellipsis", () => {
    const [metric] = extractMetrics(`${"word ".repeat(30)}50%`);
    expect(metric.label).toHaveLength(72);
    expect(metric.label.endsWith("…")).toBe(true);
  });
});

describe("storyMetrics and storyTerrain", () => {
  it("reads only the excerpt", () => {
    const study = caseStudy({ excerpt: "Sales up 30%", content: "<p>Up 99%</p>" });
    expect(storyMetrics(study).map((m) => m.value)).toEqual(["30%"]);
    expect(storyMetrics(caseStudy({ excerpt: "a 1%, b 2%" }), 1)).toHaveLength(1);
  });

  it("raises a bar per stated number, or a flat floor", () => {
    expect(storyTerrain(extractMetrics("up 40%, down 10%"))).toEqual([40, 10]);
    expect(storyTerrain([])).toEqual(FLAT);
  });
});

describe("listTerrain", () => {
  it("takes each story's headline metric, featured stories first", () => {
    expect(
      listTerrain([
        caseStudy({ id: "1", excerpt: "up 10%, then 20%" }),
        caseStudy({ id: "2", excerpt: "up 50%", featured: true }),
        caseStudy({ id: "3", excerpt: "No numbers." }),
      ])
    ).toEqual([50, 10]);
  });

  it("caps the bars at sixteen", () => {
    const many = Array.from({ length: 20 }, (_, i) =>
      caseStudy({ id: String(i), excerpt: `up ${i + 1}%` })
    );
    expect(listTerrain(many)).toHaveLength(16);
  });

  it("counts stories per industry when none states a number", () => {
    expect(
      listTerrain([
        caseStudy({ id: "1", excerpt: "x", category: "Insurance" }),
        caseStudy({ id: "2", excerpt: "y", category: "Retail" }),
        caseStudy({ id: "3", excerpt: "z", category: "Insurance" }),
      ])
    ).toEqual([2, 1]);
  });

  it("is a flat floor without stories", () => {
    expect(listTerrain([])).toEqual(FLAT);
  });
});
