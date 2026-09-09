import { logger } from '../../utils/logger';
import { DEFAULT_TDS_REGIME_KEY } from './payroll-settings.model';
import { TaxRegimeModel, TaxSlabModel } from './tax-slab.model';

/**
 * The starting income-tax table, so SLAB mode computes something on a fresh install.
 *
 * SEED VALUES ONLY. Every figure below — the bands, the standard deduction, the rebate and
 * the cess — is what the Indian new regime looked like when this was written, and every one
 * of them moves with a finance act. CHECK THEM AGAINST THE YEAR'S FINANCE ACT and correct
 * them in HR › Tax Slabs; that screen, not this file, is where they are meant to live.
 *
 * Insert-only, like the email templates and the status catalogue: a table an HR lead has
 * corrected is never overwritten on restart, because the whole point of moving the rates
 * into the portal was that correcting them stops being a deploy.
 */
const SEED_FINANCIAL_YEAR = '2026-27';

const SEED_REGIME = {
  regimeKey: DEFAULT_TDS_REGIME_KEY,
  financialYear: SEED_FINANCIAL_YEAR,
  name: 'New regime',
  standardDeduction: 75_000,
  rebateIncomeLimit: 700_000,
  rebateMaxTax: 25_000,
  cessPercent: 4,
  active: true,
};

/** `toAmount: null` is the open-ended top band; the bands are contiguous by construction. */
const SEED_SLABS = [
  { fromAmount: 0, toAmount: 300_000, ratePercent: 0, order: 0 },
  { fromAmount: 300_000, toAmount: 700_000, ratePercent: 5, order: 1 },
  { fromAmount: 700_000, toAmount: 1_000_000, ratePercent: 10, order: 2 },
  { fromAmount: 1_000_000, toAmount: 1_200_000, ratePercent: 15, order: 3 },
  { fromAmount: 1_200_000, toAmount: 1_500_000, ratePercent: 20, order: 4 },
  { fromAmount: 1_500_000, toAmount: null, ratePercent: 30, order: 5 },
];

/**
 * Puts the seed regime and its bands in when that regime and year are absent, and does
 * nothing at all otherwise. Returns how many bands were inserted, which is zero on every
 * restart after the first.
 */
export async function ensureTaxSlabs(): Promise<number> {
  const existing = await TaxRegimeModel.findOne({
    regimeKey: SEED_REGIME.regimeKey,
    financialYear: SEED_REGIME.financialYear,
  })
    .select('_id')
    .lean();
  if (existing) {
    return 0;
  }

  await TaxRegimeModel.create(SEED_REGIME);
  await TaxSlabModel.insertMany(
    SEED_SLABS.map((slab) => ({
      ...slab,
      regimeKey: SEED_REGIME.regimeKey,
      financialYear: SEED_REGIME.financialYear,
      active: true,
    })),
  );
  logger.info(
    `Tax slabs: seeded the ${SEED_REGIME.name} for ${SEED_FINANCIAL_YEAR} — check the bands against this year's finance act in HR › Tax Slabs`,
  );
  return SEED_SLABS.length;
}
