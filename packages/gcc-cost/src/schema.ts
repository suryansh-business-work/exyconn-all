import { z } from 'zod';
import { LIMITS } from './limits';

/**
 * The estimate, version 1. Every number the calculator keeps is an input; totals are never
 * stored, so an imported or shared estimate is always recomputed by the current engine.
 *
 * Objects are strict: an unknown key (including `__proto__` or `constructor` smuggled in
 * through JSON) fails validation instead of being carried along.
 */
export const SCHEMA_VERSION = 1;
export const EXPORT_FORMAT = 'exyconn.gcc-estimate';

const ID_PATTERN = /^[a-z0-9][a-z0-9-]{0,63}$/;
const CURRENCY_PATTERN = /^[A-Z]{3}$/;
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export const idSchema = z.string().regex(ID_PATTERN, 'Use lowercase letters, digits and dashes');
export const currencySchema = z.string().regex(CURRENCY_PATTERN, 'Use a 3-letter ISO code');
const text = (max: number) => z.string().trim().max(max);
const label = (max: number) => text(max).min(1, 'Required');
const amount = z.number().finite().min(0).max(LIMITS.amount);
const percent = z.number().finite().min(0).max(100);
const month = z.number().int().min(1).max(LIMITS.months);
const count = (max: number) => z.number().int().min(0).max(max);
const isoDate = z.union([z.literal(''), z.string().regex(DATE_PATTERN)]);
const httpUrl = z.union([z.literal(''), z.url({ protocol: /^https?$/ }).max(500)]);

export const SOURCE_KINDS = ['user', 'illustrative', 'verified'] as const;
export const sourceSchema = z.strictObject({
  kind: z.enum(SOURCE_KINDS),
  note: text(300),
  url: httpUrl,
  checkedOn: isoDate,
});

export const LINE_SECTIONS = ['office', 'technology', 'legal', 'hr', 'admin', 'services'] as const;
export const PRICING_MODELS = ['flat', 'per-employee', 'per-hire', 'percentage'] as const;
export const PERCENT_BASES = ['payroll', 'office', 'technology', 'operating'] as const;
export const FREQUENCIES = ['one-time', 'monthly', 'quarterly', 'annual'] as const;
export const APPLICABILITY = ['applicable', 'not-applicable', 'review'] as const;

export const categorySchema = z.strictObject({
  id: idSchema,
  section: z.enum(LINE_SECTIONS),
  label: label(80),
});

export const costLineSchema = z
  .strictObject({
    id: idSchema,
    section: z.enum(LINE_SECTIONS),
    categoryId: idSchema,
    label: label(120),
    description: text(500),
    pricing: z.enum(PRICING_MODELS),
    quantity: z.number().finite().min(0).max(LIMITS.quantity),
    unitPrice: amount,
    currency: currencySchema,
    ratePct: percent,
    percentBase: z.enum(PERCENT_BASES),
    frequency: z.enum(FREQUENCIES),
    startMonth: month,
    endMonth: month.nullable(),
    escalationPct: percent,
    setupFee: amount,
    taxRatePct: percent,
    applicability: z.enum(APPLICABILITY),
    optional: z.boolean(),
    enabled: z.boolean(),
    source: sourceSchema,
  })
  .refine((line) => line.endMonth === null || line.endMonth >= line.startMonth, {
    message: 'End month must be on or after the start month',
    path: ['endMonth'],
  });

export const SENIORITIES = ['junior', 'mid', 'senior', 'lead', 'manager', 'director'] as const;
export const COST_BASES = ['gross', 'all-inclusive'] as const;

export const roleSchema = z.strictObject({
  id: idSchema,
  department: label(80),
  title: label(120),
  seniority: z.enum(SENIORITIES),
  headcount: count(LIMITS.headcount),
  annualGross: amount,
  costBasis: z.enum(COST_BASES),
  basicSharePct: percent,
  employerPfPct: percent,
  pfWageCapped: z.boolean(),
  gratuityPct: percent,
  otherStatutoryPct: percent,
  benefitsAnnual: amount,
  shiftAllowanceMonthly: amount,
  incrementPct: percent.nullable(),
  recruitmentFeePct: percent,
  hireMonth: month,
  rampMonths: z.number().int().min(1).max(LIMITS.months),
  attritionPct: percent.nullable(),
});

export const OFFICE_MODELS = [
  'coworking',
  'managed',
  'leased',
  'dedicated',
  'remote-first',
] as const;

export const officeSchema = z.strictObject({
  city: text(60),
  microLocation: text(80),
  model: z.enum(OFFICE_MODELS),
  seats: count(LIMITS.headcount),
  utilisationPct: percent,
  areaPerSeatSqft: z.number().finite().min(0).max(1000),
  rentPerSqftMonthly: amount,
  camPerSqftMonthly: amount,
  seatPriceMonthly: amount,
  depositMonths: z.number().finite().min(0).max(24),
  fitoutPerSqft: amount,
  furnitureSetup: amount,
  internetMonthly: amount,
  utilitiesMonthly: amount,
  housekeepingSecurityMonthly: amount,
  transportParkingInsuranceMonthly: amount,
  rentEscalationPct: percent,
  expansions: z
    .array(z.strictObject({ id: idSchema, month, seats: count(LIMITS.headcount) }))
    .max(LIMITS.expansions),
});

export const subscriptionSchema = z.strictObject({
  id: idSchema,
  provider: label(60),
  plan: text(60),
  pricePerUserMonthly: amount,
  currency: currencySchema,
  users: count(LIMITS.headcount),
  startMonth: month,
});

export const MODEL_KINDS = ['chat', 'embedding'] as const;

export const tokenUsageSchema = z
  .strictObject({
    id: idSchema,
    provider: label(60),
    model: label(80),
    kind: z.enum(MODEL_KINDS),
    currency: currencySchema,
    inputPerMTok: amount,
    outputPerMTok: amount,
    cachedInputPerMTok: amount,
    batchDiscountPct: percent,
    inputMTokMonthly: z.number().finite().min(0).max(LIMITS.quantity),
    outputMTokMonthly: z.number().finite().min(0).max(LIMITS.quantity),
    cachedInputMTokMonthly: z.number().finite().min(0).max(LIMITS.quantity),
    batchSharePct: percent,
    startMonth: month,
    source: sourceSchema,
  })
  .refine((usage) => usage.cachedInputMTokMonthly <= usage.inputMTokMonthly, {
    message: 'Cached input cannot exceed total input',
    path: ['cachedInputMTokMonthly'],
  });

export const aiSchema = z.strictObject({
  mode: z.enum(['usage', 'budget']),
  monthlyBudget: amount,
  budgetCurrency: currencySchema,
  subscriptions: z.array(subscriptionSchema).max(LIMITS.subscriptions),
  usage: z.array(tokenUsageSchema).max(LIMITS.subscriptions),
  hardwarePerEmployee: amount,
  hardwareCycleMonths: z.number().int().min(12).max(96),
});

export const OPERATING_MODELS = ['captive', 'managed', 'bot', 'hybrid'] as const;
export const WORKING_MODELS = ['on-site', 'hybrid', 'remote'] as const;
export const SHIFT_PATTERNS = ['general', 'extended', 'rotational', 'round-the-clock'] as const;
export const FORECAST_MONTHS = [12, 24, 36, 60] as const;

export const profileSchema = z.strictObject({
  operatingModel: z.enum(OPERATING_MODELS),
  launchDate: isoDate,
  launchTimeline: text(60),
  initialHeadcount: count(LIMITS.headcount),
  targetHeadcountYear3: count(LIMITS.headcount),
  workingModel: z.enum(WORKING_MODELS),
  shiftPattern: z.enum(SHIFT_PATTERNS),
});

export const assumptionsSchema = z.strictObject({
  forecastMonths: z.union(FORECAST_MONTHS.map((value) => z.literal(value))),
  salaryInflationPct: percent,
  techGrowthPct: percent,
  attritionPct: percent,
  contingencyPct: percent,
  workingCapitalMonths: z.number().finite().min(0).max(24),
  paymentTiming: z.enum(['advance', 'arrears']),
  discountRatePct: percent.nullable(),
  pfWageCeilingMonthly: amount,
  /** Indirect tax charged on rent, seats and facility services (cash cost before any credit). */
  officeTaxPct: percent,
  /** Indirect tax on subscriptions, API usage and hardware. */
  technologyTaxPct: percent,
  monthlyBenefit: amount.nullable(),
  operatingPhaseMonth: month,
});

export const scenarioSchema = z.strictObject({
  id: idSchema,
  name: label(60),
  profile: profileSchema,
  office: officeSchema,
  roles: z.array(roleSchema).max(LIMITS.roles),
  ai: aiSchema,
  categories: z.array(categorySchema).max(LIMITS.categories),
  lines: z.array(costLineSchema).max(LIMITS.lines),
  assumptions: assumptionsSchema,
});

export const fxRateSchema = z.strictObject({
  currency: currencySchema,
  inrPerUnit: z.number().finite().positive().max(1_000_000),
  source: text(120),
  asOf: isoDate,
  userProvided: z.boolean(),
});

export const companySchema = z.strictObject({
  companyName: text(120),
  parentCountry: text(60),
  industry: text(80),
  purpose: text(200),
});

const uniqueIds = (items: readonly { id: string }[]) =>
  new Set(items.map((item) => item.id)).size === items.length;

export const estimateSchema = z
  .strictObject({
    schemaVersion: z.literal(SCHEMA_VERSION),
    appVersion: text(40),
    id: idSchema,
    name: label(120),
    company: companySchema,
    reportingCurrency: currencySchema,
    fxRates: z.array(fxRateSchema).max(LIMITS.currencies),
    scenarios: z.array(scenarioSchema).min(1).max(LIMITS.scenarios),
    activeScenarioId: idSchema,
    createdAt: z.iso.datetime(),
    updatedAt: z.iso.datetime(),
  })
  .refine((estimate) => estimate.scenarios.some((s) => s.id === estimate.activeScenarioId), {
    message: 'The active scenario does not exist',
    path: ['activeScenarioId'],
  })
  .refine((estimate) => uniqueIds(estimate.scenarios), {
    message: 'Scenario ids must be unique',
    path: ['scenarios'],
  })
  .refine((estimate) => uniqueIds(estimate.fxRates.map((rate) => ({ id: rate.currency }))), {
    message: 'Each currency may have one rate',
    path: ['fxRates'],
  })
  .refine(
    (estimate) =>
      estimate.reportingCurrency === 'INR' ||
      estimate.fxRates.some((rate) => rate.currency === estimate.reportingCurrency),
    { message: 'Add an exchange rate for the reporting currency', path: ['reportingCurrency'] },
  );

export const exportFileSchema = z.strictObject({
  format: z.literal(EXPORT_FORMAT),
  schemaVersion: z.literal(SCHEMA_VERSION),
  exportedAt: z.iso.datetime(),
  estimate: estimateSchema,
});

export type Source = z.infer<typeof sourceSchema>;
export type Category = z.infer<typeof categorySchema>;
export type CostLine = z.infer<typeof costLineSchema>;
export type LineSection = CostLine['section'];
export type Role = z.infer<typeof roleSchema>;
export type Office = z.infer<typeof officeSchema>;
export type Subscription = z.infer<typeof subscriptionSchema>;
export type TokenUsage = z.infer<typeof tokenUsageSchema>;
export type AiInputs = z.infer<typeof aiSchema>;
export type Profile = z.infer<typeof profileSchema>;
export type Assumptions = z.infer<typeof assumptionsSchema>;
export type Scenario = z.infer<typeof scenarioSchema>;
export type FxRate = z.infer<typeof fxRateSchema>;
export type Company = z.infer<typeof companySchema>;
export type Estimate = z.infer<typeof estimateSchema>;
export type ExportFile = z.infer<typeof exportFileSchema>;
