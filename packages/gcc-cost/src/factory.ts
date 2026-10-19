import { z } from 'zod';
import {
  currencySchema,
  fxRateSchema,
  idSchema,
  scenarioSchema,
  SCHEMA_VERSION,
  sourceSchema,
  type Estimate,
  type Scenario,
} from './schema';

/**
 * An entry of the AI model price list the calculator offers. Prices are per million tokens in
 * the entry's currency and carry where they came from and when they were last checked; choosing
 * one copies the prices into the estimate, so a later price-list change never alters a saved
 * estimate silently.
 */
export const pricingEntrySchema = z.strictObject({
  id: idSchema,
  provider: z.string().trim().min(1).max(60),
  model: z.string().trim().min(1).max(80),
  kind: z.enum(['chat', 'embedding']),
  currency: currencySchema,
  inputPerMTok: z.number().min(0),
  outputPerMTok: z.number().min(0),
  cachedInputPerMTok: z.number().min(0),
  batchDiscountPct: z.number().min(0).max(100),
  effectiveDate: z.string().max(10),
  source: sourceSchema,
});
export type PricingEntry = z.infer<typeof pricingEntrySchema>;

/** What a new estimate starts from: the scenario templates and the editable reference lists. */
export const calculatorPresetSchema = z.strictObject({
  reportingCurrency: currencySchema,
  currencies: z.array(currencySchema).min(1).max(20),
  fxRates: z.array(fxRateSchema).max(20),
  scenarios: z.array(scenarioSchema).min(1).max(6),
  pricing: z.array(pricingEntrySchema).max(100),
  cities: z.array(z.string().trim().min(1).max(60)).max(50),
  departments: z.array(z.string().trim().min(1).max(80)).max(50),
});
export type CalculatorPreset = z.infer<typeof calculatorPresetSchema>;

/** A fresh id matching `idSchema`: `prefix-` and 12 random hex characters. */
export function newId(prefix: string): string {
  return `${prefix}-${globalThis.crypto.randomUUID().replaceAll('-', '').slice(0, 12)}`;
}

const clone = <T>(value: T): T => structuredClone(value);

export function createEstimate(preset: CalculatorPreset, name: string, now: string): Estimate {
  const scenarios = clone(preset.scenarios);
  return {
    schemaVersion: SCHEMA_VERSION,
    appVersion: '',
    id: newId('estimate'),
    name,
    company: { companyName: '', parentCountry: '', industry: '', purpose: '' },
    reportingCurrency: preset.reportingCurrency,
    fxRates: clone(preset.fxRates),
    scenarios,
    activeScenarioId: scenarios[0].id,
    createdAt: now,
    updatedAt: now,
  };
}

export function duplicateScenario(scenario: Scenario, name: string): Scenario {
  return { ...clone(scenario), id: newId('scenario'), name };
}

/** A copy under a new id and name; scenario ids may stay, they are unique within an estimate. */
export function duplicateEstimate(estimate: Estimate, name: string, now: string): Estimate {
  return { ...clone(estimate), id: newId('estimate'), name, createdAt: now, updatedAt: now };
}
