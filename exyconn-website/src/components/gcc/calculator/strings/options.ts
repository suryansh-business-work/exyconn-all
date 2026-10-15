import type { Assumptions, CostLine, Office, Profile, Role, TokenUsage } from "@exyconn/gcc-cost";

/** Display labels for every enumerated value the calculator offers, keyed by the stored value. */
export const OPERATING_MODEL_LABELS: Record<Profile["operatingModel"], string> = {
  captive: "Captive (your own entity)",
  managed: "Managed GCC (partner-operated)",
  bot: "Build-operate-transfer (BOT)",
  hybrid: "Hybrid",
};

export const OPERATING_MODEL_HINTS: Record<Profile["operatingModel"], string> = {
  captive: "You own the entity and run everything. Most control, most to set up yourself.",
  managed: "A partner employs and operates the team for a fee. Faster start, less control.",
  bot: "A partner builds and runs the centre, then transfers it to you on agreed terms.",
  hybrid: "Some functions captive, others managed. Costs depend on the split.",
};

export const WORKING_MODEL_LABELS: Record<Profile["workingModel"], string> = {
  "on-site": "On-site",
  hybrid: "Hybrid",
  remote: "Remote",
};

export const SHIFT_LABELS: Record<Profile["shiftPattern"], string> = {
  general: "General shift",
  extended: "Extended hours (overlap with HQ)",
  rotational: "Rotational shifts",
  "round-the-clock": "24×7 coverage",
};

export const OFFICE_MODEL_LABELS: Record<Office["model"], string> = {
  coworking: "Coworking (per seat)",
  managed: "Managed office (per seat)",
  leased: "Leased office (per sq ft)",
  dedicated: "Dedicated facility (per sq ft)",
  "remote-first": "Remote-first (no office)",
};

export const SENIORITY_LABELS: Record<Role["seniority"], string> = {
  junior: "Junior",
  mid: "Mid-level",
  senior: "Senior",
  lead: "Lead",
  manager: "Manager",
  director: "Director",
};

export const COST_BASIS_LABELS: Record<Role["costBasis"], string> = {
  gross: "Gross salary (add employer statutory costs)",
  "all-inclusive": "All-inclusive employer cost (nothing added)",
};

export const PRICING_LABELS: Record<CostLine["pricing"], string> = {
  flat: "Fixed amount × quantity",
  "per-employee": "Per employee",
  "per-hire": "Per hire",
  percentage: "Percentage of a base",
};

export const FREQUENCY_LABELS: Record<CostLine["frequency"], string> = {
  "one-time": "One-time",
  monthly: "Monthly",
  quarterly: "Quarterly",
  annual: "Annual",
};

export const PERCENT_BASE_LABELS: Record<CostLine["percentBase"], string> = {
  payroll: "Payroll",
  office: "Office",
  technology: "Technology",
  operating: "All operating cost",
};

export const APPLICABILITY_LABELS: Record<CostLine["applicability"], string> = {
  applicable: "Applicable",
  "not-applicable": "Not applicable",
  review: "Requires professional review",
};

export const MODEL_KIND_LABELS: Record<TokenUsage["kind"], string> = {
  chat: "Chat / generation",
  embedding: "Embeddings",
};

export const PAYMENT_TIMING_LABELS: Record<Assumptions["paymentTiming"], string> = {
  advance: "In advance (start of month)",
  arrears: "In arrears (end of month)",
};

export const SOURCE_KIND_LABELS = {
  user: "Your figure",
  illustrative: "Illustrative assumption",
  verified: "Verified source",
} as const;

/** Entries of a label map as select options, in declaration order. */
export const optionsOf = <K extends string>(labels: Record<K, string>) =>
  (Object.entries(labels) as [K, string][]).map(([value, label]) => ({ value, label }));
