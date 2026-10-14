/** The ten steps, in order. `id` is the URL fragment slug and the section's DOM anchor. */
export const SECTIONS = [
  {
    id: "profile",
    title: "Company & GCC profile",
    lede: "Who is building the centre, why, and on what timeline. Company details are optional and stay in this browser.",
  },
  {
    id: "office",
    title: "Location & office",
    lede: "City, workspace model and occupancy costs. Refundable deposits are kept apart from running costs.",
  },
  {
    id: "people",
    title: "Employees & payroll",
    lede: "Roles by department, salaries, employer contributions, hiring ramp and attrition.",
  },
  {
    id: "technology",
    title: "AI, tokens & technology",
    lede: "AI subscriptions, API token usage or a fixed budget, hardware and other technology costs.",
  },
  {
    id: "legal",
    title: "Legal, entity & compliance",
    lede: "Jurisdiction-dependent items. Mark each as applicable, not applicable or requiring professional review.",
  },
  {
    id: "hr",
    title: "HR & recruitment",
    lede: "Hiring support and people operations, priced per hire, per employee, by retainer or by fee.",
  },
  {
    id: "admin",
    title: "Admin & operations",
    lede: "Facilities, travel, telecom and the running costs of the office. Add your own items.",
  },
  {
    id: "services",
    title: "Exyconn services & custom items",
    lede: "Optional Exyconn services (priced on request) and any custom cost parameter you need.",
  },
  {
    id: "assumptions",
    title: "Forecast & assumptions",
    lede: "Forecast window, escalation, contingency, taxes, exchange rates and scenarios.",
  },
  {
    id: "results",
    title: "Results & sharing",
    lede: "Your estimate, its breakdowns and scenario comparison — then download, share or ask us to review it.",
  },
] as const;

export type SectionId = (typeof SECTIONS)[number]["id"];

/** Line sections reuse one editor; this maps a step to its cost-line section. */
export const LINE_STEPS = {
  legal: "legal",
  hr: "hr",
  admin: "admin",
  services: "services",
} as const;
