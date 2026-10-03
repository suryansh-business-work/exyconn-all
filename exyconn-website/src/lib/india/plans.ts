/**
 * The India offer's three packages — the ONE source for their prices and what each includes.
 * The plan cards, the comparison table, the form's plan picker and the Offer JSON-LD all read
 * from here, so a price or a feature changes in exactly one place.
 */
export type PlanId = "basic" | "smart" | "pro";

export interface OfferPlan {
  /** Sent as the form's `plan` value — part of the submission contract, never rename. */
  id: PlanId;
  tier: string;
  name: string;
  /** Rupees, a whole number — formatted for display by `formatRupees`. */
  price: number;
  period: string;
  cta: string;
  popular?: boolean;
}

/** A quantity a plan includes: short for the table cell, long for the plan card's bullet. */
export interface PlanAmount {
  short: string;
  long: string;
}

/** `false` = not in the plan, `true` = included (the card shows the feature's own label). */
export type PlanCell = boolean | PlanAmount;

export interface PlanFeature {
  id: string;
  /** The comparison table's row label. */
  label: string;
  /** The plan card's bullet when the cell is `true`; defaults to `label`. */
  card?: string;
  values: Readonly<Record<PlanId, PlanCell>>;
}

export const OFFER_PLANS: readonly OfferPlan[] = [
  {
    id: "basic",
    tier: "FOUNDATION",
    name: "Basic Biz",
    price: 4999,
    period: "एक बार",
    cta: "प्लान चुनें",
  },
  {
    id: "smart",
    tier: "ACCELERATOR",
    name: "Smart Biz",
    price: 9999,
    period: "एक बार",
    cta: "अभी शुरू करें",
    popular: true,
  },
  {
    id: "pro",
    tier: "DOMINANCE",
    name: "Pro Biz",
    price: 14999,
    period: "एक बार",
    cta: "सेल्स से बात करें",
  },
];

const all = { basic: true, smart: true, pro: true } as const;
const smartUp = { basic: false, smart: true, pro: true } as const;
const proOnly = { basic: false, smart: false, pro: true } as const;
const amount = (short: string, long: string): PlanAmount => ({ short, long });

export const PLAN_FEATURES: readonly PlanFeature[] = [
  { id: "logo", label: "लोगो डिज़ाइन", values: all },
  {
    id: "hosting",
    label: "वेबसाइट + होस्टिंग (1 साल)",
    card: "1 साल वेबसाइट* + होस्टिंग",
    values: all,
  },
  {
    id: "pages",
    label: "पेज",
    values: {
      basic: amount("3-5", "3-5 पेज वेबसाइट"),
      smart: amount("5-10", "5-10 पेज वेबसाइट"),
      pro: amount("5-10", "5-10 पेज वेबसाइट"),
    },
  },
  { id: "blog", label: "ब्लॉग", values: smartUp },
  { id: "mobile", label: "मोबाइल फ्रेंडली", card: "मोबाइल फ्रेंडली डिज़ाइन", values: all },
  {
    id: "cards",
    label: "विज़िटिंग कार्ड",
    values: {
      basic: amount("100", "विज़िटिंग कार्ड डिज़ाइन (100)"),
      smart: amount("500", "विज़िटिंग कार्ड डिज़ाइन (500)"),
      pro: amount("500", "विज़िटिंग कार्ड डिज़ाइन (500)"),
    },
  },
  {
    id: "forms",
    label: "फ़ॉर्म",
    values: {
      basic: amount("1", "1 फ़ॉर्म (संपर्क करें)"),
      smart: amount("5 तक", "5 फ़ॉर्म तक"),
      pro: amount("10 तक", "10 फ़ॉर्म तक"),
    },
  },
  {
    id: "email",
    label: "बिज़नेस ईमेल",
    values: {
      basic: false,
      smart: amount("1", "1 बिज़नेस ईमेल"),
      pro: amount("2", "2 बिज़नेस ईमेल"),
    },
  },
  { id: "seo", label: "बेसिक SEO", values: smartUp },
  { id: "analytics", label: "गूगल एनालिटिक्स", values: smartUp },
  { id: "chat", label: "लाइव चैट", card: "लाइव चैट इंटीग्रेशन", values: smartUp },
  { id: "ecommerce", label: "ई-कॉमर्स", card: "ई-कॉमर्स साइट", values: proOnly },
  { id: "payments", label: "पेमेंट गेटवे", values: proOnly },
  {
    id: "messaging",
    label: "WhatsApp व SMS इंटीग्रेशन",
    card: "ईमेल, WhatsApp व SMS इंटीग्रेशन",
    values: proOnly,
  },
  {
    id: "barcode",
    label: "बारकोड रीडर ऐप",
    card: "बारकोड रीडर व क्रिएटर मोबाइल ऐप",
    values: proOnly,
  },
];

const RUPEES = new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 });

/** 14999 → "14,999" (Indian digit grouping; the ₹ sign is rendered beside it). */
export const formatRupees = (price: number): string => RUPEES.format(price);

/** The plan card's bullets: every feature the plan includes, in table order. */
export function planHighlights(
  plan: Pick<OfferPlan, "id">,
  features: readonly PlanFeature[] = PLAN_FEATURES
): string[] {
  return features.flatMap((feature) => {
    const cell = feature.values[plan.id];
    if (cell === false) {
      return [];
    }
    if (cell === true) {
      return [feature.card ?? feature.label];
    }
    return [cell.long];
  });
}

/** One comparison cell: a tick, a cross or a quantity. */
export type ComparisonCell = { kind: "yes" } | { kind: "no" } | { kind: "amount"; text: string };

export const comparisonCell = (cell: PlanCell): ComparisonCell => {
  if (cell === true) {
    return { kind: "yes" };
  }
  if (cell === false) {
    return { kind: "no" };
  }
  return { kind: "amount", text: cell.short };
};

/** The form's plan picker label, e.g. "Smart Biz — ₹9,999 (लोकप्रिय)". */
export function planOptionLabel(plan: OfferPlan, popularNote: string): string {
  const base = `${plan.name} — ₹${formatRupees(plan.price)}`;
  return plan.popular ? `${base} (${popularNote})` : base;
}
