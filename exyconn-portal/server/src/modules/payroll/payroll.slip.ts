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
    },
    slabTax,
  );
}

/** The regime and bands SLAB mode applies, read once for the whole run. */
export interface TaxTable {
  regime: TaxRegimeFigures | null;
  slabs: TaxSlabRow[];
}

/**
 * The tax table for the financial year this period falls in.
 *
 * Read once per run rather than once per employee, and only in SLAB mode: the other modes
 * never look at it, so a portal that has not entered one is not asked for it.
 */
export async function taxTableFor(
  settings: PayrollTaxSettings,
  month: number,
  year: number,
): Promise<TaxTable> {
  if (settings.tdsMode !== 'SLAB') {
    return { regime: null, slabs: [] };
  }
  const regimeKey = settings.tdsRegimeKey ?? DEFAULT_TDS_REGIME_KEY;
  const financialYear = financialYearOf(year, month, startMonthOf(settings));
  const [regime, slabs] = await Promise.all([
    TaxRegimeModel.findOne({ regimeKey, financialYear }).lean(),
    TaxSlabModel.find({ regimeKey, financialYear }).lean(),
  ]);
  return { regime, slabs };
}
