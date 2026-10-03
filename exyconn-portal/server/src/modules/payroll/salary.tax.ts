import { TaxRegimeModel } from './tax-slab.model';
import { badRequest } from '../../utils/errors';
import type { GraphQLContext } from '../../middleware/auth';

/**
 * The tax half of ONE employee's salary structure: which regime they are taxed under, or
 * that they are in no tax bracket at all.
 */
export interface TaxChoice {
  /** A `TaxRegime.regimeKey`, or null to follow the regime Payroll Settings names. */
  taxRegimeKey?: string | null;
  taxExempt?: boolean | null;
}

/** One regime an employee can be put under, as the picker offers it. */
export interface TaxRegimeChoice {
  regimeKey: string;
  name: string;
  active: boolean;
}

/**
 * One row per regime key, named after its latest financial year on file.
 *
 * An employee is put under a regime, not under one year of it: the run reads the year from
 * the period, so the key is what is stored and the picker offers each key once.
 */
export async function taxRegimeChoices(): Promise<TaxRegimeChoice[]> {
  const regimes = await TaxRegimeModel.find()
    .select('regimeKey name active financialYear')
    .sort({ financialYear: -1, name: 1 })
    .lean();
  const latest = new Map<string, TaxRegimeChoice>();
  for (const regime of regimes) {
    if (!latest.has(regime.regimeKey)) {
      latest.set(regime.regimeKey, {
        regimeKey: regime.regimeKey,
        name: regime.name,
        active: regime.active,
      });
    }
  }
  return [...latest.values()];
}

/**
 * The tax choice as it is stored, checked against the regimes on file.
 *
 * No tax bracket clears the regime, so the two can never disagree on the record. A blank
 * regime means "the company default" and is stored as null. A key with no regime behind it
 * is refused: it would read as a choice on the record and quietly withhold nothing on the
 * slip. A field the caller left out is left alone, so an older client cannot reset it.
 */
export async function checkedTaxChoice<T extends TaxChoice>(input: T): Promise<T> {
  if (input.taxExempt) {
    return { ...input, taxRegimeKey: null };
  }
  if (input.taxRegimeKey === undefined) {
    return input;
  }
  const regimeKey = input.taxRegimeKey?.trim() ?? '';
  if (regimeKey === '') {
    return { ...input, taxRegimeKey: null };
  }
  if (!(await TaxRegimeModel.exists({ regimeKey }))) {
    badRequest(`There is no tax regime "${regimeKey}" on file. Add it in HR › Tax Slabs first.`);
  }
  return { ...input, taxRegimeKey: regimeKey };
}

type Mutation = (parent: unknown, args: never, ctx: GraphQLContext) => unknown;

/**
 * Runs the generic create/update of a salary structure through {@link checkedTaxChoice}, so
 * the CRUD API cannot store a regime the dedicated save would refuse.
 */
export function checkTaxChoiceIn<T extends Record<string, Mutation>>(
  mutations: T,
  name: string,
): T {
  const wrap =
    (mutation: Mutation): Mutation =>
    async (parent, args, ctx) => {
      const { input, ...rest } = args as unknown as { input: TaxChoice };
      const checked = { ...rest, input: await checkedTaxChoice(input) };
      return mutation(parent, checked as never, ctx);
    };
  return {
    ...mutations,
    [`create${name}`]: wrap(mutations[`create${name}`]),
    [`update${name}`]: wrap(mutations[`update${name}`]),
  };
}
