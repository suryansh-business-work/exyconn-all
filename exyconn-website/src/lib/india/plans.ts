/**
 * The India offer's three packages: their shapes and how the cards, the comparison table and
 * the form's plan picker read them. The plans and features themselves are the CMS page's
 * props ('offer.page'), one list read by all three, so a price or a feature changes in
 * exactly one place.
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

/** One plan's cell as the CMS stores it: every field present, so the editor shows them all. */
export interface CmsPlanCell {
  included: boolean;
  /** A quantity for the table ("5 तक"); empty when the plan simply includes the feature. */
  short: string;
  /** The quantity on the plan card ("5 फ़ॉर्म तक"). */
  long: string;
}

/** A feature as the CMS stores it ('offer.page' props). */
export interface CmsPlanFeature {
  id: string;
  label: string;
  /** The plan card's bullet when included without a quantity; empty = the label. */
  card: string;
  values: Readonly<Record<PlanId, CmsPlanCell>>;
}

const toCell = (cell: CmsPlanCell): PlanCell => {
  if (!cell.included) {
    return false;
  }
  return cell.short ? { short: cell.short, long: cell.long } : true;
};

/** The CMS's features as the cards and the comparison read them. */
export const planFeaturesFromCms = (features: readonly CmsPlanFeature[]): PlanFeature[] =>
  features.map((feature) => ({
    id: feature.id,
    label: feature.label,
    card: feature.card || undefined,
    values: {
      basic: toCell(feature.values.basic),
      smart: toCell(feature.values.smart),
      pro: toCell(feature.values.pro),
    },
  }));

const RUPEES = new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 });

/** 14999 → "14,999" (Indian digit grouping; the ₹ sign is rendered beside it). */
export const formatRupees = (price: number): string => RUPEES.format(price);

/** The plan card's bullets: every feature the plan includes, in table order. */
export function planHighlights(
  plan: Pick<OfferPlan, "id">,
  features: readonly PlanFeature[]
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
