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
