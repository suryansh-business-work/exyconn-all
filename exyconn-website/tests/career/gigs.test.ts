/** Gig shaping for the careers pages: the shared category map, pay, apply links, filters. */
import { describe, expect, it } from "vitest";
import { cmsComponent } from "@exyconn/cms";
import {
  gigApplyLink,
  gigCategoryOptions,
  gigFilterData,
  gigHref,
  gigPay,
  isOpenGig,
  orderedGigs,
  relatedGigs,
} from "../../src/lib/career/gigs";
import { gigCategoryColors, groupByGigCategory } from "../../src/lib/gigCategoryColors";
import { FIXTURE_GIGS } from "../fixtures/careers";

// The gig page's wording is the CMS's (catalogue defaults = what exyconn.com is seeded with).
const GIG_COPY = cmsComponent("career.gig")?.defaultProps as { apply: { subject: string } };

const [first] = FIXTURE_GIGS;
const open = FIXTURE_GIGS.filter(isOpenGig);

describe("gig categories", () => {
  it("lists every gig under its category — AI/ML, Other and unknown ones included", () => {
    const gigs = [
      ...FIXTURE_GIGS,
      { ...first, gigCode: "NEW-2", category: "Translation" },
      { ...first, gigCode: "NEW-1", category: "Audio" },
    ];
    const groups = groupByGigCategory(gigs);
    expect(groups.flatMap((group) => group.items)).toHaveLength(gigs.length);
    expect(groups.map((group) => group.category)).toEqual([
      "Development",
      "Design",
      "Writing",
      "Video",
      "Data",
      "AI/ML",
      "Other",
      "Audio",
      "Translation",
    ]);
    expect(orderedGigs(gigs)).toHaveLength(gigs.length);
  });

  it("offers a filter chip for every category it lists", () => {
    const options = gigCategoryOptions(open);
    expect(options.map((option) => option.label)).toEqual(
      groupByGigCategory(open).map((group) => group.category)
    );
    expect(options).toContainEqual({ value: "ai-ml", label: "AI/ML" });
    open.forEach((gig) =>
      expect(options.map((o) => o.value)).toContain(gigFilterData(gig)["data-filter-category"])
    );
  });

  it("orders gigs urgent first, then newest, within a category", () => {
    const a = { ...first, gigCode: "A", isUrgent: false, postedDate: "2026-09-01" };
    const b = { ...first, gigCode: "B", isUrgent: false, postedDate: "2026-09-05" };
    const c = { ...first, gigCode: "C", isUrgent: true, postedDate: "2026-08-01" };
    expect(orderedGigs([a, b, c]).map((gig) => gig.gigCode)).toEqual(["C", "B", "A"]);
  });

  it("paints known categories in their hue and the rest neutral", () => {
    expect(gigCategoryColors("AI/ML").ink).toBe("var(--color-indigo-fg)");
    expect(gigCategoryColors("Other")).toEqual({
      tint: "var(--color-surface-muted)",
      ink: "var(--color-fg-muted)",
      solid: "var(--color-fg-subtle)",
    });
    expect(gigCategoryColors("Anything new").ink).toBe("var(--color-fg-muted)");
  });
});

describe("gig facts", () => {
  it("shows pay only when the posting has a budget", () => {
    expect(gigPay({ budget: " ₹40,000 " })).toBe("₹40,000");
    expect(gigPay({ budget: "  " })).toBeUndefined();
  });

  it("treats only open gigs as open", () => {
    expect(isOpenGig({ status: "open" })).toBe(true);
    expect(isOpenGig({ status: "completed" })).toBe(false);
  });

  it("links to the gig's own page", () => {
    expect(gigHref({ gigCode: "GIG-001" })).toBe("/career/gig/GIG-001");
  });

  it("filters by search text and sorts by posted date and deadline", () => {
    const data = gigFilterData({ ...first, deadline: "2026-10-11T00:00:00.000Z" });
    expect(data["data-search"]).toContain(first.title);
    expect(data["data-sort-deadline"]).toBe(20261011);
    expect(gigFilterData({ ...first, deadline: null })["data-sort-deadline"]).toBe(99_999_999);
  });

  it("relates other open gigs, same category first", () => {
    const related = relatedGigs(open[0], open, 2);
    expect(related).toHaveLength(2);
    expect(related.map((gig) => gig.gigCode)).not.toContain(open[0].gigCode);
    const sibling = { ...open[1], gigCode: "SIB", category: open[0].category };
    expect(relatedGigs(open[0], [...open, sibling])[0].gigCode).toBe("SIB");
  });
});

describe("gig apply link", () => {
  const subject = GIG_COPY.apply.subject;

  it("emails the contact with the subject filled in", () => {
    expect(gigApplyLink(first, subject)).toEqual({
      kind: "email",
      href: `mailto:gigs@example.com?subject=${encodeURIComponent(`Application for ${first.title} (${first.gigCode})`)}`,
      external: false,
    });
  });

  it("opens WhatsApp with the digits of the number", () => {
    const link = gigApplyLink(
      { ...first, applicationType: "whatsapp", applicationContact: "+91 90000 00001" },
      subject
    );
    expect(link?.href).toMatch(/^https:\/\/wa\.me\/919000000001\?text=/);
    expect(link?.external).toBe(true);
  });

  it("links a form by its address, only when it is safe", () => {
    expect(
      gigApplyLink(
        { ...first, applicationType: "form", applicationContact: "https://x.example/apply" },
        subject
      )
    ).toEqual({ kind: "form", href: "https://x.example/apply", external: true });
    expect(
      gigApplyLink({ ...first, applicationType: "form", applicationContact: "/contact" }, subject)
        ?.external
    ).toBe(false);
    expect(
      gigApplyLink(
        { ...first, applicationType: "form", applicationContact: "javascript:alert(1)" },
        subject
      )
    ).toBeNull();
  });

  it("offers nothing when the contact is unusable", () => {
    expect(gigApplyLink({ ...first, applicationContact: "not an email" }, subject)).toBeNull();
    expect(
      gigApplyLink({ ...first, applicationType: "whatsapp", applicationContact: "none" }, subject)
    ).toBeNull();
  });
});
