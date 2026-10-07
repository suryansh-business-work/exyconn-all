/** Freelance gigs shaped for the careers pages. */
import { describe, expect, it } from "vitest";
import {
  gigApplyLink,
  gigCategoryOptions,
  gigFilterData,
  gigHref,
  gigPay,
  isOpenGig,
  orderedGigs,
  relatedGigs,
} from "../../../../src/lib/career/gigs";
import { gig } from "./fixtures";

const SUBJECT = "Application: {title} ({code})";

describe("gig basics", () => {
  it("takes applications only while open", () => {
    expect(isOpenGig(gig({ status: "open" }))).toBe(true);
    expect(isOpenGig(gig({ status: "completed" }))).toBe(false);
  });

  it("shows pay only when the budget is set", () => {
    expect(gigPay(gig({ budget: "  ₹20,000 " }))).toBe("₹20,000");
    expect(gigPay(gig({ budget: "   " }))).toBeUndefined();
  });

  it("links to the gig's page by its code", () => {
    expect(gigHref(gig({ gigCode: "GIG-7" }))).toBe("/career/gig/GIG-7");
  });
});

describe("gigApplyLink", () => {
  it("opens a WhatsApp chat with the subject as its text", () => {
    const link = gigApplyLink(
      gig({ applicationType: "whatsapp", applicationContact: "+91 98765-43210" }),
      SUBJECT
    );
    expect(link).toEqual({
      kind: "whatsapp",
      href: `https://wa.me/919876543210?text=${encodeURIComponent("Application: Logo design (GIG-1)")}`,
      external: true,
    });
  });

  it("offers no WhatsApp link without digits", () => {
    expect(
      gigApplyLink(gig({ applicationType: "whatsapp", applicationContact: "n/a" }), SUBJECT)
    ).toBeNull();
  });

  it("links to an external or same-site form", () => {
    expect(
      gigApplyLink(
        gig({ applicationType: "form", applicationContact: " https://forms.example/x " }),
        SUBJECT
      )
    ).toEqual({ kind: "form", href: "https://forms.example/x", external: true });
    expect(
      gigApplyLink(gig({ applicationType: "form", applicationContact: "/apply" }), SUBJECT)
    ).toEqual({
      kind: "form",
      href: "/apply",
      external: false,
    });
  });

  it("offers no form link when the address is unsafe", () => {
    expect(
      gigApplyLink(
        gig({ applicationType: "form", applicationContact: "javascript:alert(1)" }),
        SUBJECT
      )
    ).toBeNull();
  });

  it("emails the contact with the subject filled in", () => {
    expect(gigApplyLink(gig({ applicationContact: " jobs@example.com " }), SUBJECT)).toEqual({
      kind: "email",
      href: `mailto:jobs@example.com?subject=${encodeURIComponent("Application: Logo design (GIG-1)")}`,
      external: false,
    });
  });

  it("offers no email link when the contact is not an address", () => {
    expect(gigApplyLink(gig({ applicationContact: "call us" }), SUBJECT)).toBeNull();
  });
});

describe("relatedGigs", () => {
  const current = gig({ gigCode: "A", category: "Design" });

  it("lists other gigs, same category first, then newest, up to the count", () => {
    const open = [
      current,
      gig({ gigCode: "B", category: "Writing", postedDate: "2026-09-30" }),
      gig({ gigCode: "C", category: "Design", postedDate: "2026-08-01" }),
      gig({ gigCode: "D", category: "Design", postedDate: "2026-09-15" }),
      gig({ gigCode: "E", category: "Video", postedDate: "2026-09-20" }),
    ];
    expect(relatedGigs(current, open).map((g) => g.gigCode)).toEqual(["D", "C", "B"]);
    expect(relatedGigs(current, open, 1).map((g) => g.gigCode)).toEqual(["D"]);
  });

  it("is empty when the gig is the only one", () => {
    expect(relatedGigs(current, [current])).toEqual([]);
  });
});

describe("orderedGigs and the category chips", () => {
  const gigs = [
    gig({ gigCode: "1", category: "Design", postedDate: "2026-09-01" }),
    gig({ gigCode: "2", category: "Development", postedDate: "2026-08-01" }),
    gig({ gigCode: "3", category: "Design", postedDate: "2026-09-10" }),
    gig({ gigCode: "4", category: "Design", postedDate: "2026-07-01", isUrgent: true }),
    gig({ gigCode: "5", category: "AI/ML" }),
  ];

  it("orders by category, urgent then newest within each", () => {
    expect(orderedGigs(gigs).map((g) => g.gigCode)).toEqual(["2", "4", "3", "1", "5"]);
  });

  it("offers a chip per category present, in category order", () => {
    expect(gigCategoryOptions(gigs)).toEqual([
      { value: "development", label: "Development" },
      { value: "design", label: "Design" },
      { value: "ai-ml", label: "AI/ML" },
    ]);
  });
});

describe("gigFilterData", () => {
  it("gives FilterBar the category, search text and sort keys", () => {
    const data = gigFilterData(
      gig({
        title: "Landing page",
        category: "AI/ML",
        shortDescription: "Fast",
        tags: ["astro", "seo"],
        postedDate: "2026-09-03",
        deadline: "2026-10-01",
      })
    );
    expect(data).toEqual({
      "data-filter-item": true,
      "data-filter-category": "ai-ml",
      "data-search": "Landing page AI/ML Fast astro seo",
      "data-sort-posted": 20260903,
      "data-sort-deadline": 20261001,
    });
  });

  it("sorts a gig without a deadline last", () => {
    expect(gigFilterData(gig({ deadline: null }))["data-sort-deadline"]).toBe(99_999_999);
  });
});
