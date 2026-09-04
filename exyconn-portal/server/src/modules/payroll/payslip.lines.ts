import { grossOf, type StructureParts } from './payroll.compute';

/** One printed row of a payslip: what it is and what it is worth. */
export interface PayslipLine {
  label: string;
  amount: number;
}

export interface PayslipTotals {
  earnings: PayslipLine[];
  deductions: PayslipLine[];
}

/** Slip figures as stored; the components come from the employee's salary structure. */
export interface SlipAmountsRow {
  gross: number;
  deductions: number;
}

/**
 * Splits a stored slip back into the lines a payslip prints.
 *
 * The slip stores totals; the components live on the salary structure. They only belong
 * on the same page when they still add up — if the structure has been revised since the
 * slip was generated, printing its components against last month's total would be a
 * payslip that lies, so the totals are printed on their own instead.
 */
export function payslipLines(
  slip: SlipAmountsRow,
  structure: StructureParts | null,
): PayslipTotals {
  if (!structure || grossOf(structure) !== slip.gross) {
    return {
      earnings: [{ label: 'Gross earnings', amount: slip.gross }],
      deductions: [{ label: 'Total deductions', amount: slip.deductions }],
    };
  }
  const lossOfPay = slip.deductions - structure.deductions;
  const deductions: PayslipLine[] = [{ label: 'Deductions', amount: structure.deductions }];
  if (lossOfPay > 0) {
    deductions.push({ label: 'Loss of pay', amount: lossOfPay });
  }
  return {
    earnings: [
      { label: 'Basic', amount: structure.basic },
      { label: 'House rent allowance', amount: structure.hra },
      { label: 'Other allowances', amount: structure.allowances },
    ].filter((line) => line.amount > 0),
    deductions: deductions.filter((line) => line.amount > 0),
  };
}

/** `Payslip-Ravi-Kumar-2026-08.pdf` — safe on every filesystem and mail client. */
export function payslipFilename(employeeName: string, year: number, month: number): string {
  const slug = employeeName
    .trim()
    .replaceAll(/[^a-zA-Z0-9]+/g, '-')
    .replaceAll(/^-|-$/g, '');
  const paddedMonth = String(month).padStart(2, '0');
  return `Payslip-${slug || 'employee'}-${year}-${paddedMonth}.pdf`;
}
