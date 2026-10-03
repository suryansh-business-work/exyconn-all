/**
 * The get-a-quote estimator: its options (the rates and roles the page has always used,
 * unchanged) and the arithmetic. Pure — the form, the summary panel and the downloaded
 * summary all read the same `estimate`.
 */
export interface ProjectType {
  id: string;
  label: string;
  /** Complexity multiplier applied to the base cost. */
  multiplier: number;
  description: string;
}

export interface Role {
  id: string;
  label: string;
  /** USD per hour. */
  rate: number;
  isCustom?: boolean;
}

export interface RoleGroup {
  name: string;
  roles: readonly Role[];
}

export interface DurationPreset {
  id: string;
  label: string;
  /** 0 for "custom": the visitor types the months. */
  months: number;
  description: string;
}

export interface HoursOption {
  id: string;
  label: string;
  hours: number;
}

export const PROJECT_TYPES: readonly ProjectType[] = [
  { id: "mvp", label: "MVP / Prototype", multiplier: 0.6, description: "Quick proof of concept" },
  {
    id: "saas",
    label: "SaaS Application",
    multiplier: 1,
    description: "Full-featured SaaS platform",
  },
  {
    id: "enterprise",
    label: "Enterprise App",
    multiplier: 1.5,
    description: "Large-scale enterprise solution",
  },
  { id: "mobile", label: "Mobile App", multiplier: 0.8, description: "iOS & Android application" },
  { id: "ai", label: "AI/ML Solution", multiplier: 1.3, description: "AI-powered application" },
  { id: "ecommerce", label: "E-Commerce", multiplier: 1.1, description: "Online store platform" },
  { id: "other", label: "Other", multiplier: 1, description: "Custom project type" },
];

export const ROLE_GROUPS: readonly RoleGroup[] = [
  {
    name: "Product & Management",
    roles: [
      { id: "pm", label: "Project Manager", rate: 50 },
      { id: "product", label: "Product Manager", rate: 55 },
      { id: "scrum", label: "Scrum Master", rate: 48 },
    ],
  },
  {
    name: "Engineering",
    roles: [
      { id: "frontend", label: "Frontend Engineer", rate: 40 },
      { id: "backend", label: "Backend Engineer", rate: 45 },
      { id: "fullstack", label: "Full Stack Engineer", rate: 50 },
      { id: "ai-ml", label: "AI/ML Engineer", rate: 60 },
      { id: "devops", label: "DevOps Engineer", rate: 55 },
      { id: "data", label: "Data Engineer", rate: 55 },
      { id: "security", label: "Security Engineer", rate: 65 },
    ],
  },
  {
    name: "Design & QA",
    roles: [
      { id: "designer", label: "UI/UX Designer", rate: 38 },
      { id: "qa", label: "QA Engineer", rate: 35 },
      { id: "qa-auto", label: "QA Automation", rate: 45 },
    ],
  },
  { name: "Custom", roles: [{ id: "custom", label: "Custom Role", rate: 50, isCustom: true }] },
];

export const DURATION_PRESETS: readonly DurationPreset[] = [
  { id: "1w", label: "1 Week (MVP)", months: 0.25, description: "Proof of concept" },
  { id: "1m", label: "1 Month", months: 1, description: "Small project" },
  { id: "3m", label: "3 Months", months: 3, description: "Medium project" },
  { id: "6m", label: "6 Months", months: 6, description: "Large project" },
  { id: "12m", label: "12 Months", months: 12, description: "Enterprise project" },
  { id: "custom", label: "Custom", months: 0, description: "Set your own" },
];

export const HOURS_OPTIONS: readonly HoursOption[] = [
  { id: "part", label: "Part-time", hours: 80 },
  { id: "full", label: "Full-time", hours: 160 },
  { id: "dedicated", label: "Dedicated", hours: 200 },
];

export const ROLES: readonly Role[] = ROLE_GROUPS.flatMap((group) => group.roles);

/** Bounds the form enforces; the old calculator clamped to the same minimums. */
export const QUOTE_LIMITS = {
  minCount: 1,
  maxCount: 10,
  minRate: 20,
  maxRate: 500,
  minMonths: 0.25,
  maxMonths: 60,
  maxTeam: 12,
} as const;

/** One line of the team: a role, how many people and their hourly rate. */
export interface TeamLine {
  roleId: string;
  count: number;
  rate: number;
  /** The name typed for a custom role. */
  customLabel: string;
}

export interface QuoteInput {
  projectTypeId: string;
  team: readonly TeamLine[];
  durationId: string;
  customMonths: number;
  hoursId: string;
}

export interface Estimate {
  projectType: ProjectType;
  team: { label: string; count: number; rate: number }[];
  teamSize: number;
  months: number;
  hoursPerMonth: number;
  baseTotal: number;
  total: number;
}

const byId = <T extends { id: string }>(list: readonly T[], id: string): T => {
  const found = list.find((item) => item.id === id);
  if (!found) {
    throw new Error(`Unknown option "${id}"`);
  }
  return found;
};

export const findRole = (id: string): Role => byId(ROLES, id);

/** What a team line is called: the typed name for a custom role, else the role's label. */
export const lineLabel = (line: TeamLine): string => {
  const role = findRole(line.roleId);
  return role.isCustom && line.customLabel.trim() ? line.customLabel.trim() : role.label;
};

/** The months the project runs: the preset's, or the typed number for "custom". */
export const durationMonths = (durationId: string, customMonths: number): number => {
  const preset = byId(DURATION_PRESETS, durationId);
  return preset.months > 0 ? preset.months : customMonths;
};

export const estimate = (input: QuoteInput): Estimate => {
  const projectType = byId(PROJECT_TYPES, input.projectTypeId);
  const months = durationMonths(input.durationId, input.customMonths);
  const hoursPerMonth = byId(HOURS_OPTIONS, input.hoursId).hours;
  const baseTotal = input.team.reduce(
    (sum, line) => sum + line.count * line.rate * hoursPerMonth * months,
    0
  );
  return {
    projectType,
    team: input.team.map((line) => ({
      label: lineLabel(line),
      count: line.count,
      rate: line.rate,
    })),
    teamSize: input.team.reduce((sum, line) => sum + line.count, 0),
    months,
    hoursPerMonth,
    baseTotal,
    total: Math.round(baseTotal * projectType.multiplier),
  };
};

/** The next role to add: the first standard role not in the team yet, else the custom one. */
export const nextRole = (team: readonly TeamLine[]): Role => {
  const used = new Set(team.map((line) => line.roleId));
  return ROLES.find((role) => !role.isCustom && !used.has(role.id)) ?? findRole("custom");
};

const USD = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

export const formatUsd = (amount: number): string => USD.format(amount);

const plural = (count: number, one: string, many: string) => `${count} ${count === 1 ? one : many}`;

/** "2 weeks" under a month, otherwise "3 months". */
export const formatDuration = (months: number): string =>
  months < 1 ? plural(Math.round(months * 4), "week", "weeks") : plural(months, "month", "months");

/** The complexity adjustment, e.g. "+30%", "-40%", "0%". */
export const formatAdjustment = (multiplier: number): string => {
  const percent = Math.round((multiplier - 1) * 100);
  return percent > 0 ? `+${percent}%` : `${percent}%`;
};

/** The defaults the old calculator opened with: full stack + QA, 3 months, full time. */
export const DEFAULT_QUOTE_INPUT: QuoteInput = {
  projectTypeId: "mvp",
  team: [
    { roleId: "fullstack", count: 1, rate: findRole("fullstack").rate, customLabel: "" },
    { roleId: "qa", count: 1, rate: findRole("qa").rate, customLabel: "" },
  ],
  durationId: "3m",
  customMonths: 3,
  hoursId: "full",
};

const finite = (value: unknown): number => {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
};

/** The form's values while it is being filled in: any field may still be missing. */
export interface QuoteInputDraft {
  projectTypeId?: string;
  team?: readonly (Partial<TeamLine> | undefined)[];
  durationId?: string;
  customMonths?: number;
  hoursId?: string;
}

/**
 * A half-typed form as something `estimate` can price: a number box that is empty or
 * mid-edit counts as 0 instead of turning the total into NaN, and a row without a role yet
 * is left out.
 */
export const toQuoteInput = (values: QuoteInputDraft): QuoteInput => ({
  projectTypeId: values.projectTypeId ?? DEFAULT_QUOTE_INPUT.projectTypeId,
  team: (values.team ?? []).flatMap((line) =>
    line?.roleId
      ? [
          {
            roleId: line.roleId,
            count: finite(line.count),
            rate: finite(line.rate),
            customLabel: line.customLabel ?? "",
          },
        ]
      : []
  ),
  durationId: values.durationId ?? DEFAULT_QUOTE_INPUT.durationId,
  customMonths: finite(values.customMonths),
  hoursId: values.hoursId ?? DEFAULT_QUOTE_INPUT.hoursId,
});
