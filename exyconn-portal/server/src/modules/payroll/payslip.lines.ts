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
  /** The deductions total: the structure's own, plus loss of pay, plus every statutory line. */
  deductions: number;
  pf?: number | null;
  esi?: number | null;
  professionalTax?: number | null;
  tds?: number | null;
}

/** The statutory lines of a slip, named as the employee will read them on the PDF. */
function statutoryLines(slip: SlipAmountsRow): PayslipLine[] {
  return [
    { label: 'Provident fund (PF)', amount: slip.pf ?? 0 },
    { label: 'Employee state insurance (ESI)', amount: slip.esi ?? 0 },
    { label: 'Professional tax', amount: slip.professionalTax ?? 0 },
    { label: 'Income tax (TDS)', amount: slip.tds ?? 0 },
  ];
}

/** Everything the slip withheld under a statutory head, together. */
function statutoryTotal(slip: SlipAmountsRow): number {
  return statutoryLines(slip).reduce((total, line) => total + line.amount, 0);
}

/**
 * Splits a stored slip back into the lines a payslip prints.
 *
 * The slip stores totals; the components live on the salary structure. They only belong
 * on the same page when they still add up — if the structure has been revised since the
 * slip was generated, printing its components against last month's total would be a
 * payslip that lies, so the totals are printed on their own instead.
 *
 * The statutory heads are read off the slip itself rather than recomputed, because a
 * payslip has to say what was actually withheld, not what today's settings would withhold.
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
  const lossOfPay = slip.deductions - structure.deductions - statutoryTotal(slip);
  const deductions: PayslipLine[] = [
    ...statutoryLines(slip),
    { label: 'Deductions', amount: structure.deductions },
    { label: 'Loss of pay', amount: lossOfPay },
  ];
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
