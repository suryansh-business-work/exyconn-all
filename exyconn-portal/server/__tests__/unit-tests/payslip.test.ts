import { payslipLines, payslipFilename } from '../../src/modules/payroll/payslip.lines';
import { buildPayslipPdf, periodLabel, formatAmount } from '../../src/modules/payroll/payslip.pdf';
import { logoHeight } from '../../src/modules/payroll/payslip.brand';
import {
  isDue,
  periodKey,
  targetPeriod,
  zonedParts,
  type ScheduleShape,
} from '../../src/modules/payroll/payroll.schedule';

const structure = { basic: 50_000, hra: 20_000, allowances: 10_000, deductions: 5_000 };

describe('payslip lines', () => {
  it('splits a slip into its earning and deduction components', () => {
    const lines = payslipLines({ gross: 80_000, deductions: 5_000 }, structure);
    expect(lines.earnings).toEqual([
      { label: 'Basic', amount: 50_000 },
      { label: 'House rent allowance', amount: 20_000 },
      { label: 'Other allowances', amount: 10_000 },
    ]);
    expect(lines.deductions).toEqual([{ label: 'Deductions', amount: 5_000 }]);
  });

  it('shows loss of pay as its own line when the slip deducted more than the structure', () => {
    const lines = payslipLines({ gross: 80_000, deductions: 6_612 }, structure);
    expect(lines.deductions).toEqual([
      { label: 'Deductions', amount: 5_000 },
      { label: 'Loss of pay', amount: 1_612 },
    ]);
  });

  it('names every statutory head and leaves loss of pay as what is left over', () => {
    const lines = payslipLines(
      { gross: 80_000, deductions: 8_812, pf: 1_800, esi: 0, professionalTax: 200, tds: 1_812 },
      structure,
    );
    expect(lines.deductions).toEqual([
      { label: 'Provident fund (PF)', amount: 1_800 },
      { label: 'Professional tax', amount: 200 },
      { label: 'Income tax (TDS)', amount: 1_812 },
      { label: 'Deductions', amount: 5_000 },
    ]);
  });

  it('leaves out a statutory head that withheld nothing', () => {
    const lines = payslipLines(
      { gross: 80_000, deductions: 5_000, pf: 0, esi: 0, professionalTax: 0, tds: 0 },
      structure,
    );
    expect(lines.deductions).toEqual([{ label: 'Deductions', amount: 5_000 }]);
  });

  it('prints totals only when the structure was revised after the slip was generated', () => {
    const lines = payslipLines({ gross: 70_000, deductions: 5_000 }, structure);
    expect(lines.earnings).toEqual([{ label: 'Gross earnings', amount: 70_000 }]);
    expect(lines.deductions).toEqual([{ label: 'Total deductions', amount: 5_000 }]);
  });

  it('prints totals when the employee has no salary structure at all', () => {
    const lines = payslipLines({ gross: 70_000, deductions: 0 }, null);
    expect(lines.earnings).toEqual([{ label: 'Gross earnings', amount: 70_000 }]);
  });

  it('names the file after the employee and the period', () => {
    expect(payslipFilename('Ravi  Kumar', 2026, 8)).toBe('Payslip-Ravi-Kumar-2026-08.pdf');
    expect(payslipFilename('!!!', 2026, 12)).toBe('Payslip-employee-2026-12.pdf');
  });
});

const payslipData = {
  company: {
    name: 'Exyconn',
    address: 'Indore',
    supportEmail: 'support@exyconn.com',
    hrEmail: 'hr@exyconn.com',
  },
  employee: {
    name: 'Ravi Kumar',
    email: 'ravi@exyconn.com',
    designation: 'Engineer',
    department: 'Tech',
    joinDate: new Date('2024-04-01T00:00:00.000Z'),
  },
  slip: {
    month: 8,
    year: 2026,
    currency: 'INR',
    gross: 80_000,
    deductions: 8_812,
    pf: 1_800,
    esi: 0,
    professionalTax: 200,
    tds: 1_812,
    net: 71_188,
    status: 'PAID',
    issuedDate: new Date('2026-09-01T00:00:00.000Z'),
  },
  structure,
  identifiers: { pfNumber: 'PF/1234', esiNumber: 'ESI/9876', panNumber: 'ABCDE1234F' },
};

describe('payslip pdf', () => {
  it('renders a real PDF document', async () => {
    const pdf = await buildPayslipPdf(payslipData);
    expect(pdf.length).toBeGreaterThan(1_000);
    expect(pdf.subarray(0, 5).toString()).toBe('%PDF-');
  });

  it('is a PDF/A-3b document, so it still renders when it is produced years later', async () => {
    const pdf = await buildPayslipPdf(payslipData);
    const source = pdf.toString('latin1');
    expect(pdf.subarray(0, 8).toString()).toBe('%PDF-1.7');
    // ISO 19005-3 identification, and the sRGB output intent it obliges the file to carry.
    expect(/pdfaid:part>3</.exec(source)).not.toBeNull();
    expect(/pdfaid:conformance>B</.exec(source)).not.toBeNull();
    expect(source).toContain('GTS_PDFA1');
    expect(source).toContain('sRGB IEC61966-2.1');
  });

  it('embeds its fonts rather than naming ones the reader has to already own', async () => {
    const pdf = await buildPayslipPdf(payslipData);
    const source = pdf.toString('latin1');
    // A TrueType font programme in the file itself, and none of the standard 14 by name.
    expect(source).toContain('FontFile2');
    expect(source).not.toContain('Helvetica');
  });

  it('scales the logo to the aspect ratio of the mark', () => {
    expect(logoHeight(160)).toBeCloseTo(42);
    expect(logoHeight(80)).toBeCloseTo(21);
  });

  it('labels the period and the money the way the email does', () => {
    expect(periodLabel(8, 2026)).toBe('August 2026');
    expect(formatAmount(75_000, 'INR')).toContain('75,000');
  });
});

describe('payslip schedule', () => {
  const schedule: ScheduleShape = {
    enabled: true,
    dayOfMonth: 1,
    hour: 10,
    minute: 0,
    period: 'PREVIOUS_MONTH' as const,
    lastRunPeriod: '',
  };

  it('reads the clock in the portal timezone, not the server one', () => {
    // 05:30 UTC on 1 September is 11:00 the same day in Kolkata.
    const parts = zonedParts(new Date('2026-09-01T05:30:00.000Z'), 'Asia/Kolkata');
    expect(parts).toEqual({ year: 2026, month: 9, day: 1, hour: 11, minute: 0 });
  });

  it('fires on the chosen day once the chosen minute has passed', () => {
    const now = { year: 2026, month: 9, day: 1, hour: 11, minute: 0 };
    expect(isDue(schedule, now)).toBe(true);
    expect(isDue(schedule, { ...now, hour: 9 })).toBe(false);
    expect(isDue(schedule, { ...now, day: 2 })).toBe(false);
    expect(isDue({ ...schedule, enabled: false }, now)).toBe(false);
  });

  it('never sends the same period twice', () => {
    const now = { year: 2026, month: 9, day: 1, hour: 11, minute: 0 };
    expect(isDue({ ...schedule, lastRunPeriod: '2026-08' }, now)).toBe(false);
    expect(isDue({ ...schedule, lastRunPeriod: '2026-07' }, now)).toBe(true);
  });

  it('resolves which month a run sends for', () => {
    const january = { year: 2026, month: 1, day: 1, hour: 11, minute: 0 };
    expect(targetPeriod('PREVIOUS_MONTH', january)).toEqual({ month: 12, year: 2025 });
    expect(targetPeriod('CURRENT_MONTH', january)).toEqual({ month: 1, year: 2026 });
    expect(periodKey(12, 2025)).toBe('2025-12');
  });
});
