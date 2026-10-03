import { describe, expect, it } from "vitest";
import { contactChannels, phoneHref } from "../../src/lib/india/contact";
import { OFFER_SCENE } from "../../src/lib/india/offer";
import {
  comparisonCell,
  formatRupees,
  OFFER_PLANS,
  PLAN_FEATURES,
  planHighlights,
  planOptionLabel,
} from "../../src/lib/india/plans";
import { offerServiceJsonLd } from "../../src/lib/india/structured-data";

const LABELS = { phoneLabel: "फ़ोन करें", emailLabel: "ईमेल करें", email: "growth@exyconn.com" };
const plan = (id: string) => OFFER_PLANS.find((p) => p.id === id)!;

describe("India offer plans", () => {
  it("keeps the three packages and their prices in one place", () => {
    expect(OFFER_PLANS.map((p) => [p.id, p.price])).toEqual([
      ["basic", 4999],
      ["smart", 9999],
      ["pro", 14999],
    ]);
    expect(OFFER_PLANS.filter((p) => p.popular).map((p) => p.id)).toEqual(["smart"]);
  });

  it("formats rupees with Indian grouping", () => {
    expect(formatRupees(14999)).toBe("14,999");
    expect(formatRupees(100000)).toBe("1,00,000");
  });

  it("lists a card's bullets from the shared features, verbatim", () => {
    expect(planHighlights(plan("basic"))).toEqual([
      "लोगो डिज़ाइन",
      "1 साल वेबसाइट* + होस्टिंग",
      "3-5 पेज वेबसाइट",
      "मोबाइल फ्रेंडली डिज़ाइन",
      "विज़िटिंग कार्ड डिज़ाइन (100)",
      "1 फ़ॉर्म (संपर्क करें)",
    ]);
    expect(planHighlights(plan("smart"))).toHaveLength(11);
    expect(planHighlights(plan("pro"))).toHaveLength(15);
    expect(planHighlights(plan("pro"))).toContain("बारकोड रीडर व क्रिएटर मोबाइल ऐप");
  });

  it("turns each cell into a tick, a cross or the short quantity", () => {
    expect(comparisonCell(true)).toEqual({ kind: "yes" });
    expect(comparisonCell(false)).toEqual({ kind: "no" });
    expect(comparisonCell({ short: "5 तक", long: "5 फ़ॉर्म तक" })).toEqual({
      kind: "amount",
      text: "5 तक",
    });
  });

  it("gives every feature a value for every plan", () => {
    for (const feature of PLAN_FEATURES) {
      expect(Object.keys(feature.values).toSorted((a, b) => a.localeCompare(b))).toEqual([
        "basic",
        "pro",
        "smart",
      ]);
    }
  });

  it("labels the form's plan options from the same prices", () => {
    expect(planOptionLabel(plan("basic"), "लोकप्रिय")).toBe("Basic Biz — ₹4,999");
    expect(planOptionLabel(plan("smart"), "लोकप्रिय")).toBe("Smart Biz — ₹9,999 (लोकप्रिय)");
  });

  it("draws one cube per package", () => {
    expect(OFFER_SCENE.data).toEqual({ cubes: { cubes: 3 } });
  });
});

describe("India offer contact channels", () => {
  it("shows no phone line when branding has no number", () => {
    expect(contactChannels("", LABELS).map((c) => c.id)).toEqual(["email"]);
    expect(contactChannels("   ", LABELS).map((c) => c.id)).toEqual(["email"]);
  });

  it("puts the branding number first, dialable", () => {
    const [phone, email] = contactChannels(" +91 98765 43210 ", LABELS);
    expect(phone).toMatchObject({
      id: "phone",
      value: "+91 98765 43210",
      href: "tel:+919876543210",
    });
    expect(email).toMatchObject({ href: "mailto:growth@exyconn.com", label: "ईमेल करें" });
  });

  it("dials a number without a plus as digits only", () => {
    expect(phoneHref("(022) 1234-5678")).toBe("tel:02212345678");
  });
});

describe("India offer JSON-LD", () => {
  it("publishes the three packages as INR offers", () => {
    const ld = offerServiceJsonLd("Offer", "desc", "https://exyconn.com/india/offer", OFFER_PLANS, {
      name: "Exyconn",
      url: "https://exyconn.com",
    });
    expect(ld["@type"]).toBe("Service");
    expect(ld.hasOfferCatalog.itemListElement.map((o) => [o.price, o.priceCurrency])).toEqual([
      ["4999", "INR"],
      ["9999", "INR"],
      ["14999", "INR"],
    ]);
    expect(ld.hasOfferCatalog.itemListElement[0].url).toBe("https://exyconn.com/india/offer#plans");
  });
});
