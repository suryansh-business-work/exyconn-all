import type { ComparedMetric, CostSection } from "@exyconn/gcc-cost";

export const COST_SECTION_LABELS: Record<CostSection, string> = {
  payroll: "Payroll",
  recruitment: "Recruitment",
  office: "Office",
  technology: "AI & technology",
  legal: "Legal & compliance",
  hr: "HR",
  admin: "Admin & operations",
  services: "Services & custom",
};

export const METRIC_LABELS: Record<ComparedMetric, string> = {
  setupCost: "One-time setup",
  deposits: "Refundable deposits",
  initialCash: "Initial cash requirement",
  monthlyOperating: "Monthly operating (phase month)",
  costPerEmployeeMonthly: "Cost per employee / month",
  forecastTotal: "Forecast total",
};

export const RESULTS = {
  headline: "Headline figures",
  horizons: "Forecast totals by horizon",
  horizon: (months: number) => `${months} months`,
  byCategory: "Cost by category",
  byDepartment: "Cost by department",
  departmentsEmpty: "No roles yet — add them in Employees & payroll.",
  timeline: "Monthly cost and headcount",
  timelineCaption: (months: number) =>
    `Total monthly cost (bars) and headcount (line) over ${months} months. The table below lists the same figures.`,
  timelineTable: "Monthly figures",
  month: "Month",
  headcount: "Headcount",
  hires: "Hires",
  total: "Total cost",
  technology: "AI and technology breakdown",
  technologyEmpty: "No AI or technology costs yet.",
  comparison: "Scenario comparison",
  comparisonNote:
    "Differences are against the first scenario. Each scenario is totalled over its own forecast window.",
  baseline: "Baseline",
  annual: "Operating cost by year",
  year: (year: number) => `Year ${year}`,
  assumptions: "Assumptions and exclusions",
  exclusions: [
    "Deposits are refundable and excluded from cost totals.",
    "Taxes are shown before any input-tax credit you may be able to claim.",
    "Optional add-ons are excluded from totals and shown separately.",
    "Exyconn service fees are quoted on request and are not priced here unless you enter them.",
    "Corporate income tax, transfer-pricing outcomes and exchange-rate movements after today are not modelled.",
  ],
  review: "Items requiring professional review",
  illustrative: "Items based on illustrative assumptions",
  none: "None",
  presentValue: "Present value of forecast",
  breakEven: "Break-even",
  breakEvenMonth: (month: number) => `Month ${month}`,
  breakEvenNone: "Not reached in the forecast window",
  breakEvenNoInput: "Add a monthly benefit in Forecast & assumptions to calculate it",
  optional: "Optional add-ons (excluded)",
  tax: "Taxes in forecast",
  contingency: "Contingency in forecast",
} as const;
