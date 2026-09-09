/**
 * Pure payroll arithmetic, kept free of Mongoose so it is unit tested directly.
 * Every rule an HR lead will be asked to explain lives here.
 */

export interface StructureParts {
  basic: number;
  hra: number;
  allowances: number;
  deductions: number;
}

/** A stored salary structure, as much of it as the arithmetic here needs. */
export interface PaySource extends Partial<StructureParts> {
  payType?: string | null;
  /** Per hour for HOURLY, per month for STIPEND and OTHER. Unused by FIXED. */
  rate?: number | null;
}

/**
 * The monthly earning components a slip is built from, whatever the pay type.
 *
 * FIXED keeps its own components. STIPEND and OTHER are a flat monthly figure, so the whole
 * of it becomes `basic` — which also makes unpaid leave prorate against it, exactly as it
 * does for a salary. HOURLY earns nothing monthly by construction: an hourly employee is
 * paid for the hours they tracked, so a monthly structure would invent money nobody agreed
 * to. Deductions apply to every type.
 *
 * Reading the defaults here rather than trusting the stored document is deliberate:
 * `.lean()` skips Mongoose defaults, so a structure written before `payType` existed comes
 * back without it and must still behave exactly as it did — as FIXED.
 */
export function monthlyEarnings(structure: PaySource): StructureParts {
  const deductions = structure.deductions ?? 0;
  const payType = structure.payType ?? 'FIXED';

  if (payType === 'HOURLY') {
    return { basic: 0, hra: 0, allowances: 0, deductions };
  }
  if (payType === 'STIPEND' || payType === 'OTHER') {
    return { basic: structure.rate ?? 0, hra: 0, allowances: 0, deductions };
  }
  return {
    basic: structure.basic ?? 0,
    hra: structure.hra ?? 0,
    allowances: structure.allowances ?? 0,
    deductions,
  };
}

export interface LeaveSpan {
  fromDate: Date;
  toDate: Date;
  type: string;
  status: string;
}

/** Days in a calendar month, month is 1-12. */
export function daysInMonth(year: number, month: number): number {
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

/** basic + hra + allowances. Takes only the earning parts so a resolver can pass a partial row. */
export function grossOf(s: Pick<StructureParts, 'basic' | 'hra' | 'allowances'>): number {
  return s.basic + s.hra + s.allowances;
}

/**
 * Approved UNPAID leave days that fall inside the given month, inclusive of both
 * ends and clipped to the month, so a span crossing month boundaries is only
 * charged for the days that belong here.
 */
export function unpaidLeaveDays(leave: LeaveSpan[], year: number, month: number): number {
  const monthStart = Date.UTC(year, month - 1, 1);
  const monthEnd = Date.UTC(year, month - 1, daysInMonth(year, month));
  const DAY = 24 * 60 * 60 * 1000;
  let days = 0;
  for (const l of leave) {
    if (l.type !== 'UNPAID' || l.status !== 'APPROVED') continue;
    const from = Math.max(
      Date.UTC(l.fromDate.getUTCFullYear(), l.fromDate.getUTCMonth(), l.fromDate.getUTCDate()),
      monthStart,
    );
    const to = Math.min(
      Date.UTC(l.toDate.getUTCFullYear(), l.toDate.getUTCMonth(), l.toDate.getUTCDate()),
      monthEnd,
    );
    if (to >= from) days += Math.round((to - from) / DAY) + 1;
  }
  return days;
}

/** A per-day share of basic for every unpaid day, rounded to whole money. */
export function lossOfPayFor(
  s: Pick<StructureParts, 'basic'>,
  year: number,
  month: number,
  unpaidDays: number,
): number {
  return Math.round((s.basic / daysInMonth(year, month)) * unpaidDays);
}

/** The statutory policy a slip is worked out against — the company-wide settings document. */
export interface StatutorySettings {
  pfEnabled: boolean;
  pfEmployeePercent: number;
  pfWageCeiling: number;
  esiEnabled: boolean;
  esiEmployeePercent: number;
  esiWageLimit: number;
  professionalTaxMonthly: number;
  tdsMode: string;
  tdsFlatPercent: number;
}

/**
 * What ONE employee's salary structure says about their own statutory position. Every
 * field overrides the company setting for this person alone: a contractor outside the PF
 * scheme, an employee whose accountant worked out their own TDS rate.
 */
export interface StatutoryOverrides {
  pfApplicable?: boolean | null;
  esiApplicable?: boolean | null;
  /** Percent of taxable pay withheld for this employee; 0 or unset means "use the setting". */
  tdsPercent?: number | null;
}

/** The named statutory lines of one month's slip. */
export interface StatutoryLines {
  pf: number;
  esi: number;
  professionalTax: number;
  tds: number;
}

export const NO_STATUTORY: StatutoryLines = { pf: 0, esi: 0, professionalTax: 0, tds: 0 };

/** Money is deducted in whole units; a fraction of a rupee belongs on nobody's payslip. */
function money(amount: number): number {
  return Math.round(amount);
}

/**
 * Employee provident fund: a percentage of BASIC, and only of the basic up to the wage
 * ceiling. An employee earning above the ceiling contributes the ceiling's amount, not a
 * percentage of their whole salary — that cap is the entire point of the ceiling.
 */
export function providentFund(
  basic: number,
  settings: StatutorySettings,
  applicable: boolean,
): number {
  if (!settings.pfEnabled || !applicable) return 0;
  const pensionable = Math.min(basic, settings.pfWageCeiling);
  return money((pensionable * settings.pfEmployeePercent) / 100);
}

/**
 * Employee state insurance: a percentage of GROSS, and only while gross is at or below the
 * wage limit. The boundary is inclusive — an employee earning exactly the limit is covered,
 * which is what makes the figure a limit rather than a threshold.
 */
export function employeeStateInsurance(
  gross: number,
  settings: StatutorySettings,
  applicable: boolean,
): number {
  if (!settings.esiEnabled || !applicable) return 0;
  if (gross > settings.esiWageLimit) return 0;
  return money((gross * settings.esiEmployeePercent) / 100);
}

/** Months in a year — the length of a financial year, and what an annual figure divides by. */
const MONTHS_IN_YEAR = 12;

/** One band of a tax table, reduced to the three numbers the walk needs. */
export interface TaxBand {
  from: number;
  /** Null for the open-ended top band. */
  to: number | null;
  rate: number;
}

/**
 * Progressive tax: each band's rate applied ONLY to the part of the income inside it.
 *
 * Applying the top band's rate to every rupee is the classic payroll bug. It overtaxes
 * everybody above the first boundary, and by the largest amount for the people least able
 * to check it, so the arithmetic is written once here and shared by every caller.
 */
export function progressiveTax(taxable: number, bands: readonly TaxBand[]): number {
  if (taxable <= 0) {
    return 0;
  }
  let tax = 0;
  for (const band of bands) {
    const ceiling = band.to ?? Number.POSITIVE_INFINITY;
    const inBand = Math.min(taxable, ceiling) - band.from;
    if (inBand > 0) {
      tax += (inBand * band.rate) / 100;
    }
  }
  return tax;
}

/** The figures one named regime carries alongside its bands, as stored on `TaxRegime`. */
export interface TaxRegimeFigures {
  standardDeduction: number;
  /** Taxable income at or below which the rebate applies. */
  rebateIncomeLimit: number;
  /** The most tax the rebate can write off. */
  rebateMaxTax: number;
  /** Charged on the tax, never on the income. */
  cessPercent: number;
  active: boolean;
}

/** One stored band of a regime's table, as `TaxSlab` holds it. */
export interface TaxSlabRow {
  fromAmount: number;
  toAmount?: number | null;
  ratePercent: number;
  order: number;
  active: boolean;
}

/** Live bands, lowest first — the order they have to be walked in to be progressive. */
function orderedBands(slabs: readonly TaxSlabRow[]): TaxBand[] {
  return (
    slabs
      .filter((slab) => slab.active)
      // Already a fresh array from `filter`, so sorting in place mutates nothing shared.
      // `toSorted` is ES2023 and the server compiles against ES2021.
      .sort((a, b) => a.order - b.order || a.fromAmount - b.fromAmount)
      .map((slab) => ({ from: slab.fromAmount, to: slab.toAmount ?? null, rate: slab.ratePercent }))
  );
}

/**
 * A year's tax on `annualTaxable` under one regime: standard deduction off the income, the
 * bands walked, the rebate off the tax, then cess on what is left.
 *
 * The order matters and is not interchangeable. The rebate is subtracted from the TAX, and
 * before cess — computing cess first and rebating after leaves a bill on somebody the
 * rebate was supposed to clear entirely.
 *
 * An inactive regime and an empty table both withhold nothing rather than throwing: a
 * half-entered table must not tax anybody, and it must not fail the payroll run either.
 */
export function annualTaxForSlabs(
  annualTaxable: number,
  regime: TaxRegimeFigures | null,
  slabs: readonly TaxSlabRow[],
): number {
  if (!regime?.active) {
    return 0;
  }
  const bands = orderedBands(slabs);
  if (bands.length === 0) {
    return 0;
  }
  const taxable = Math.max(annualTaxable - regime.standardDeduction, 0);
  const beforeRebate = progressiveTax(taxable, bands);
  const rebate =
    taxable <= regime.rebateIncomeLimit ? Math.min(beforeRebate, regime.rebateMaxTax) : 0;
  const afterRebate = Math.max(beforeRebate - rebate, 0);
  return money(afterRebate * (1 + regime.cessPercent / 100));
}

/**
 * What to withhold from ONE month under the slab table.
 *
 * The month is projected across the months this employee is actually paid in this financial
 * year, taxed as a year, and divided back over those same months. `payableMonths` is 12 for
 * anybody who was here in April; for a mid-year joiner it is what is left of the year, which
 * is the whole point — annualising their first month by twelve would tax them on a salary
 * they will not earn this year and take most of it out of month one.
 */
export function monthlyTdsFromSlabs(
  monthlyTaxable: number,
  payableMonths: number,
  regime: TaxRegimeFigures | null,
  slabs: readonly TaxSlabRow[],
): number {
  if (monthlyTaxable <= 0 || payableMonths <= 0) {
    return 0;
  }
  const annual = annualTaxForSlabs(monthlyTaxable * payableMonths, regime, slabs);
  return money(annual / payableMonths);
}

/** The calendar year the financial year containing this period opened in. */
function financialYearStart(year: number, month: number, startMonth: number): number {
  if (month >= startMonth) {
    return year;
  }
  return year - 1;
}

/**
 * The financial year a payroll period falls in, as `2026-27` — named after the year it
 * opens in, so April 2026 through March 2027 is one label whichever month is being run.
 *
 * Derived from the period rather than stored, because a stored "current year" is a field
 * somebody has to remember to roll over every April, and a payroll run in the wrong year
 * is a payroll run against the wrong slabs.
 */
export function financialYearOf(year: number, month: number, startMonth: number): string {
  const start = financialYearStart(year, month, startMonth);
  return `${start}-${String((start + 1) % 100).padStart(2, '0')}`;
}

/**
 * How many of this financial year's months this employee is paid in.
 *
 * Twelve for anybody who joined before the year opened. For a joiner it is the months from
 * their joining month to the year's end, which both lowers the income their tax is worked
 * out on and spreads that tax over the months they will actually be paid. Never zero, so
 * the division that follows it always has something to divide by.
 */
export function payableMonthsInFinancialYear(
  joinDate: Date | null | undefined,
  year: number,
  month: number,
  startMonth: number,
): number {
  if (!joinDate) {
    return MONTHS_IN_YEAR;
  }
  const opens = financialYearStart(year, month, startMonth) * MONTHS_IN_YEAR + startMonth;
  const joined = joinDate.getUTCFullYear() * MONTHS_IN_YEAR + joinDate.getUTCMonth() + 1;
  const elapsed = joined - opens;
  if (elapsed <= 0) {
    return MONTHS_IN_YEAR;
  }
  return Math.min(Math.max(MONTHS_IN_YEAR - elapsed, 1), MONTHS_IN_YEAR);
}

/** The slab table a run applies, resolved once for the month and shared by every employee. */
export interface SlabTaxInput {
  regime: TaxRegimeFigures | null;
  slabs: readonly TaxSlabRow[];
  /** This employee's paid months in the financial year the period falls in. */
  payableMonths: number;
}

/**
 * Tax deducted at source from one month's taxable pay.
 *
 * Precedence, in order: `NONE` withholds nothing at all; an employee's own recorded rate
 * beats every mode, because somebody has worked their position out and this is where it is
 * written down; `SLAB` walks the regime's table; `FLAT_PERCENT` takes the company rate.
 *
 * `SLAB` with no table resolved withholds nothing — an unconfigured portal must not invent
 * a rate, and the caller that has not looked one up is one that could not.
 */
export function taxDeductedAtSource(
  taxable: number,
  settings: StatutorySettings,
  overridePercent: number,
  slabTax?: SlabTaxInput,
): number {
  if (settings.tdsMode === 'NONE') {
    return 0;
  }
  const pay = Math.max(taxable, 0);
  if (overridePercent > 0) {
    return money((pay * overridePercent) / 100);
  }
  if (settings.tdsMode === 'SLAB') {
    if (!slabTax) {
      return 0;
    }
    return monthlyTdsFromSlabs(pay, slabTax.payableMonths, slabTax.regime, slabTax.slabs);
  }
  if (settings.tdsFlatPercent <= 0) {
    return 0;
  }
  return money((pay * settings.tdsFlatPercent) / 100);
}

/**
 * Every statutory line of one month, in the order they depend on each other: PF and ESI
 * off the contracted components, professional tax flat, and TDS on what is left after the
 * three of them and after any loss of pay — the pay the employee is actually taxed on.
 */
export function statutoryDeductions(
  parts: StructureParts,
  lossOfPay: number,
  settings: StatutorySettings,
  overrides: StatutoryOverrides = {},
  slabTax?: SlabTaxInput,
): StatutoryLines {
  const gross = grossOf(parts);
  const pf = providentFund(parts.basic, settings, overrides.pfApplicable ?? true);
  const esi = employeeStateInsurance(gross, settings, overrides.esiApplicable ?? true);
  const professionalTax = money(settings.professionalTaxMonthly);
  const taxable = gross - lossOfPay - pf - esi - professionalTax;
  const tds = taxDeductedAtSource(taxable, settings, overrides.tdsPercent ?? 0, slabTax);
  return { pf, esi, professionalTax, tds };
}

export interface SlipAmounts extends StatutoryLines {
  gross: number;
  lossOfPay: number;
  /** The employee's own fixed deductions from their salary structure — never a statutory one. */
  otherDeductions: number;
  /** Everything above added together. The slip's single deductions total. */
  deductions: number;
  net: number;
}

/**
 * One month's slip. Loss of pay is a per-day share of basic for each unpaid day; total
 * deductions = the structure's own deductions + loss of pay + every statutory line; net
 * never goes below zero.
 */
export function computeSlip(
  s: StructureParts,
  year: number,
  month: number,
  unpaidDays: number,
  statutory: StatutoryLines = NO_STATUTORY,
): SlipAmounts {
  const gross = grossOf(s);
  const lossOfPay = lossOfPayFor(s, year, month, unpaidDays);
  const otherDeductions = s.deductions;
  const deductions =
    otherDeductions +
    lossOfPay +
    statutory.pf +
    statutory.esi +
    statutory.professionalTax +
    statutory.tds;
  return {
    gross,
    lossOfPay,
    ...statutory,
    otherDeductions,
    deductions,
    net: Math.max(gross - deductions, 0),
  };
}

/**
 * One month's slip end to end: loss of pay, then the statutory lines that depend on it,
 * then the totals. This is the whole of what a payroll run decides about one employee, so
 * the run itself contains no arithmetic and this function can be tested on its own.
 */
export function computeMonthlySlip(
  s: StructureParts,
  year: number,
  month: number,
  unpaidDays: number,
  settings: StatutorySettings,
  overrides: StatutoryOverrides = {},
  slabTax?: SlabTaxInput,
): SlipAmounts {
  const lop = lossOfPayFor(s, year, month, unpaidDays);
  const statutory = statutoryDeductions(s, lop, settings, overrides, slabTax);
  return computeSlip(s, year, month, unpaidDays, statutory);
}
