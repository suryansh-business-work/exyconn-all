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

/**
 * Tax deducted at source, as a percentage of taxable pay.
 *
 * `NONE` withholds nothing. `FLAT_PERCENT` uses the employee's own rate when one is
 * recorded and the company rate otherwise. `SLAB` means the rate was worked out off the
 * portal, so ONLY a rate recorded against the employee is used — taxing somebody at a
 * guessed slab is worse than not withholding at all.
 */
export function taxDeductedAtSource(
  taxable: number,
  settings: StatutorySettings,
  overridePercent: number,
): number {
  if (settings.tdsMode === 'NONE') return 0;
  const fallback = settings.tdsMode === 'SLAB' ? 0 : settings.tdsFlatPercent;
  const percent = overridePercent > 0 ? overridePercent : fallback;
  if (percent <= 0) return 0;
  return money((Math.max(taxable, 0) * percent) / 100);
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
): StatutoryLines {
  const gross = grossOf(parts);
  const pf = providentFund(parts.basic, settings, overrides.pfApplicable ?? true);
  const esi = employeeStateInsurance(gross, settings, overrides.esiApplicable ?? true);
  const professionalTax = money(settings.professionalTaxMonthly);
  const taxable = gross - lossOfPay - pf - esi - professionalTax;
  const tds = taxDeductedAtSource(taxable, settings, overrides.tdsPercent ?? 0);
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
): SlipAmounts {
  const lop = lossOfPayFor(s, year, month, unpaidDays);
  return computeSlip(s, year, month, unpaidDays, statutoryDeductions(s, lop, settings, overrides));
}
