export const A = {
  illustrative:
    "Defaults are illustrative assumptions, not market benchmarks. Replace them with your own figures, quotes and advice.",
  forecast: "Forecast",
  forecastMonths: "Forecast duration",
  phaseMonth: "Operating phase month",
  phaseTip:
    "The month whose run-rate is shown as the monthly operating cost and cost per employee.",
  escalation: "Escalation and people",
  salaryInflation: "Annual salary inflation",
  rentEscalation: "Rent escalation",
  techGrowth: "Technology budget growth",
  attrition: "Annual attrition",
  finance: "Contingency, cash and taxes",
  contingency: "Contingency",
  contingencyTip:
    "A buffer on pre-tax setup and operating cost for what the estimate cannot foresee.",
  workingCapital: "Working-capital reserve",
  workingCapitalTip:
    "Months of average first-year operating cost (with tax) held in the initial cash requirement.",
  paymentTiming: "Payment timing",
  officeTax: "Tax on office costs",
  technologyTax: "Tax on technology costs",
  taxTip:
    "Indirect tax shown separately and before any input-tax credit. Confirm the rate that applies to you.",
  pfCeiling: "PF wage ceiling per month",
  analysis: "Optional analysis",
  discountRate: "Discount rate for present value",
  discountHint: "Leave empty to skip present value",
  benefit: "Monthly benefit (savings or revenue)",
  benefitHint: "Needed for break-even; leave empty to skip it",
  rates: "Exchange rates",
  ratesNote:
    "Amounts are calculated in INR. Rates are stored with the estimate and only change when you change or refresh them.",
  addRate: "Add rate",
  currency: "Currency",
  inrPerUnit: (currency: string) => `INR per 1 ${currency || "unit"}`,
  source: "Source",
  asOf: "Rate date",
  userProvided: "Entered by me",
  manualSource: "Entered by you",
  fetch: "Fetch reference rates",
  fetching: "Fetching rates…",
  fetched: (list: string) => `Updated: ${list}. Review them before relying on the totals.`,
  fetchFailed: (message: string) =>
    `Rates could not be fetched: ${message} Enter them manually instead.`,
  change: (currency: string, from: string, to: string) => `${currency} ${from} → ${to}`,
  added: (currency: string, to: string) => `${currency} ${to} (new)`,
  scenarios: "Scenarios",
  scenariosNote:
    "Each scenario has its own inputs. Duplicate one to test a change; compare them in Results.",
  editing: "Editing",
  edit: "Edit",
} as const;
