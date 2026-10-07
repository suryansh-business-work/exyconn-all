import { describe, expect, it } from "vitest";
import {
  comparisonCell,
  formatRupees,
  planFeaturesFromCms,
  planHighlights,
  planOptionLabel,
  type CmsPlanCell,
  type OfferPlan,
  type PlanFeature,
} from "../../../../src/lib/india/plans";

const no: CmsPlanCell = { included: false, short: "ignored", long: "ignored" };
const yes: CmsPlanCell = { included: true, short: "", long: "" };
const upTo = (count: number): CmsPlanCell => ({
  included: true,
  short: `${count}`,
  long: `Up to ${count} forms`,
});

const features: PlanFeature[] = planFeaturesFromCms([
  {
    id: "site",
    label: "Website",
    card: "A mobile-ready website",
    values: { basic: yes, smart: yes, pro: yes },
  },
  { id: "forms", label: "Forms", card: "", values: { basic: no, smart: upTo(5), pro: upTo(20) } },
  { id: "seo", label: "SEO", card: "", values: { basic: no, smart: no, pro: yes } },
]);

describe("plan features from the CMS", () => {
  it("turns each stored cell into a tick, a cross or a quantity", () => {
    expect(features[1].values).toEqual({
      basic: false,
      smart: { short: "5", long: "Up to 5 forms" },
      pro: { short: "20", long: "Up to 20 forms" },
    });
    expect(features[0].values.basic).toBe(true);
  });

  it("keeps the card bullet only when the CMS set one", () => {
    expect(features[0].card).toBe("A mobile-ready website");
    expect(features[1].card).toBeUndefined();
  });
});

describe("plan card bullets", () => {
  it("lists every included feature in table order, quantities in their long form", () => {
    expect(planHighlights({ id: "smart" }, features)).toEqual([
      "A mobile-ready website",
      "Up to 5 forms",
    ]);
    expect(planHighlights({ id: "pro" }, features)).toEqual([
      "A mobile-ready website",
      "Up to 20 forms",
      "SEO",
    ]);
    expect(planHighlights({ id: "basic" }, features)).toEqual(["A mobile-ready website"]);
  });
});

describe("comparison cells", () => {
  it("reads a cell as yes, no or the short quantity", () => {
    expect(comparisonCell(true)).toEqual({ kind: "yes" });
    expect(comparisonCell(false)).toEqual({ kind: "no" });
    expect(comparisonCell({ short: "5", long: "Up to 5 forms" })).toEqual({
      kind: "amount",
      text: "5",
    });
  });
});

describe("prices", () => {
  it("formats rupees with Indian digit grouping and no decimals", () => {
    expect(formatRupees(14999)).toBe("14,999");
    expect(formatRupees(1234567)).toBe("12,34,567");
    expect(formatRupees(999.6)).toBe("1,000");
  });

  it("labels a plan in the picker, noting the popular one", () => {
    const plan: OfferPlan = {
      id: "smart",
      tier: "2",
      name: "Smart Biz",
      price: 9999,
      period: "once",
      cta: "Choose",
    };
    expect(planOptionLabel(plan, "popular")).toBe("Smart Biz — ₹9,999");
    expect(planOptionLabel({ ...plan, popular: true }, "popular")).toBe(
      "Smart Biz — ₹9,999 (popular)"
    );
  });
});
