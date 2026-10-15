export const P = {
  add: "Add role",
  empty: "No roles yet. Add the roles you plan to hire — headcount and payroll come from them.",
  newTitle: "New role",
  department: "Department",
  departmentHint: "Pick one or type your own",
  title: "Role",
  seniority: "Seniority",
  headcount: "Headcount",
  annualGross: "Average annual gross salary",
  costBasis: "Salary basis",
  costBasisTip:
    "Gross: employer statutory costs are added on top. All-inclusive: the salary is the full employer cost, so nothing is added again.",
  basicShare: "Basic wages share of salary",
  basicShareTip:
    "Under India's labour codes, wages are generally at least 50% of remuneration. PF and gratuity are based on wages.",
  employerPf: "Employer PF",
  employerPfTip: "Employer provident fund contribution on PF wages (12% under EPF rules).",
  pfCapped: "Apply the PF wage ceiling",
  otherStatutory: "Other employer statutory costs",
  otherStatutoryTip:
    "e.g. EDLI, PF administration charges or ESI where applicable, as a % of gross.",
  gratuity: "Gratuity provision",
  gratuityTip:
    "15 days' wages per year of service ≈ 4.81% of wages a month. Confirm with your adviser.",
  benefits: "Medical & other benefits per year",
  shift: "Shift allowance per month",
  increment: "Annual increment",
  incrementHint: "Empty: uses the scenario's salary inflation",
  recruitmentFee: "Recruitment fee",
  recruitmentFeeTip: "Agency fee as a % of annual salary, per hire including attrition backfills.",
  hireMonth: "Hiring starts in month",
  ramp: "Hiring spread over",
  attrition: "Annual attrition",
  attritionHint: "Empty: uses the scenario's attrition",
  statutoryNote:
    "Statutory rates are configurable assumptions — confirm them with a qualified adviser.",
  stats: {
    title: "Payroll overview",
    headcount: (count: string, month: number) =>
      `Headcount in month ${month} (operating phase): ${count}`,
    monthly: "Monthly payroll in that month",
    annual: "Annualised payroll (× 12)",
    loaded: "Fully loaded cost per employee / month",
    recruitment: "Recruitment fees in forecast",
  },
  perEmployee: (amount: string) => `${amount} per employee / month, fully loaded`,
} as const;
