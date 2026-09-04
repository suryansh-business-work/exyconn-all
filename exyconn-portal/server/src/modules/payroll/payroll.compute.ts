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

export interface SlipAmounts {
  gross: number;
  lossOfPay: number;
  deductions: number;
  net: number;
}

/**
 * One month's slip. Loss of pay is a per-day share of basic for each unpaid day;
 * total deductions = fixed deductions + loss of pay; net never goes below zero.
 */
export function computeSlip(
  s: StructureParts,
  year: number,
  month: number,
  unpaidDays: number,
): SlipAmounts {
  const gross = grossOf(s);
  const lossOfPay = Math.round((s.basic / daysInMonth(year, month)) * unpaidDays);
  const deductions = s.deductions + lossOfPay;
  return { gross, lossOfPay, deductions, net: Math.max(gross - deductions, 0) };
}
