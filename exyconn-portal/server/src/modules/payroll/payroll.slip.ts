import { LeaveRequestModel } from '../hr/hr.model';
import {
  computeMonthlySlip,
  financialYearOf,
  monthlyEarnings,
  unpaidLeaveDays,
  type LeaveSpan,
  type SlabTaxInput,
  type StatutorySettings,
  type TaxRegimeFigures,
  type TaxSlabRow,
} from './payroll.compute';
import {
  DEFAULT_FINANCIAL_YEAR_START_MONTH,
  DEFAULT_TDS_REGIME_KEY,
} from './payroll-settings.model';
import { TaxRegimeModel, TaxSlabModel } from './tax-slab.model';
import { periodLabel } from './payslip.pdf';

/**
 * One employee's slip for one month, worked out from what is on file. The run plan previews
 * these figures and the run stores them, so both read them from here and never disagree.
 */

/** One employee's approved unpaid leave, as plain date spans. */
async function unpaidLeaveFor(employeeId: string): Promise<LeaveSpan[]> {
  const rows = await LeaveRequestModel.find({
    employeeId,
    type: 'UNPAID',
    status: 'APPROVED',
  }).lean();
  return rows.map((r) => ({
    fromDate: new Date(r.fromDate),
    toDate: new Date(r.toDate),
    type: r.type,
    status: r.status,
  }));
}

/**
 * The tax-table half of the payroll settings.
 *
 * Both fields are optional here because `.lean()` skips Mongoose defaults: a settings
 * document saved before the tax table existed comes back without them.
 */
export interface PayrollTaxSettings {
  tdsMode: string;
  tdsRegimeKey?: string | null;
  financialYearStartMonth?: number | null;
}

/** The month the financial year opens in, as stored or as the schema would have defaulted it. */
export function startMonthOf(settings: PayrollTaxSettings): number {
  return settings.financialYearStartMonth ?? DEFAULT_FINANCIAL_YEAR_START_MONTH;
}

/** The stored figures of one slip, whichever way the run arrived at them. */
export type SlipFigures = ReturnType<typeof computeMonthlySlip>;

/** The amount columns a slip carries, so every writer stores the same set. */
export function slipFields(amounts: SlipFigures, currency: string) {
  return {
    currency,
    gross: amounts.gross,
    deductions: amounts.deductions,
    pf: amounts.pf,
    esi: amounts.esi,
    professionalTax: amounts.professionalTax,
    tds: amounts.tds,
    otherDeductions: amounts.otherDeductions,
    net: amounts.net,
  };
}

/** A slip's own document title, as the employee will find it under My Documents. */
export function payslipTitle(month: number, year: number): string {
  return `Payslip ${periodLabel(month, year)}`;
}

/** The salary-structure fields a slip is worked out from. */
export interface SlipStructure {
  payType?: string | null;
  rate?: number | null;
  basic: number;
  hra: number;
  allowances: number;
  deductions: number;
  pfApplicable?: boolean | null;
  esiApplicable?: boolean | null;
  tdsPercent?: number | null;
  taxExempt?: boolean | null;
}

/** What ONE employee's slip is worked out from, gathered before any arithmetic happens. */
export async function slipFor(
  employeeId: string,
  structure: SlipStructure,
  month: number,
  year: number,
  settings: StatutorySettings,
  slabTax: SlabTaxInput,
): Promise<SlipFigures> {
  const unpaidDays = unpaidLeaveDays(await unpaidLeaveFor(employeeId), year, month);
  return computeMonthlySlip(
    monthlyEarnings(structure),
    year,
    month,
    unpaidDays,
    settings,
    {
      pfApplicable: structure.pfApplicable,
      esiApplicable: structure.esiApplicable,
      tdsPercent: structure.tdsPercent,
      taxExempt: structure.taxExempt,
    },
    slabTax,
  );
}

/** One regime's figures and bands. */
export interface TaxTable {
  regime: TaxRegimeFigures | null;
  slabs: TaxSlabRow[];
}

/** Every regime on file for the run's financial year, and the one Payroll Settings names. */
export interface TaxTables {
  defaultKey: string;
  byKey: ReadonlyMap<string, TaxTable>;
}

const NO_TABLE: TaxTable = { regime: null, slabs: [] };

/**
 * Every regime's table for the financial year this period falls in, read once per run.
 *
 * All of them rather than the settings' one, because each employee may be taxed under a
 * regime of their own. Two small collections filtered to one year, so a run of any size
 * costs the same two reads. `NONE` mode withholds nothing and reads nothing.
 */
export async function taxTablesFor(
  settings: PayrollTaxSettings,
  month: number,
  year: number,
): Promise<TaxTables> {
  const defaultKey = settings.tdsRegimeKey ?? DEFAULT_TDS_REGIME_KEY;
  if (settings.tdsMode === 'NONE') {
    return { defaultKey, byKey: new Map() };
  }
  const financialYear = financialYearOf(year, month, startMonthOf(settings));
  const [regimes, slabs] = await Promise.all([
    TaxRegimeModel.find({ financialYear }).lean(),
    TaxSlabModel.find({ financialYear }).lean(),
  ]);
  const byKey = new Map<string, TaxTable>(
    regimes.map((regime) => [
      regime.regimeKey,
      { regime, slabs: slabs.filter((slab) => slab.regimeKey === regime.regimeKey) },
    ]),
  );
  return { defaultKey, byKey };
}

/**
 * The table ONE employee is taxed under: their own regime when HR chose one, otherwise the
 * company's. A regime with no table for this year withholds nothing, exactly as an
 * unconfigured company default does.
 */
export function slabTaxFor(
  tables: TaxTables,
  taxRegimeKey: string | null | undefined,
  payableMonths: number,
): SlabTaxInput {
  const ownKey = taxRegimeKey ?? '';
  const key = ownKey === '' ? tables.defaultKey : ownKey;
  const table = tables.byKey.get(key) ?? NO_TABLE;
  return { ...table, payableMonths, ownRegime: ownKey !== '' };
}
