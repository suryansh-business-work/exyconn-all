import {
  buildPayslipPdf,
  periodLabel,
  type PayslipData,
} from '../../../../src/modules/payroll/payslip.pdf';

/** A payslip with nothing optional on file: no address, IDs, joining date or structure. */
const BARE: PayslipData = {
  locale: 'en-US',
  company: { name: 'Acme', address: '', supportEmail: '', hrEmail: 'people@acme.test' },
  employee: {
    name: 'Sam Lee',
    email: 'sam@acme.test',
    designation: '',
    department: '',
    joinDate: null,
  },
  slip: {
    month: 3,
    year: 2026,
    currency: 'USD',
    gross: 5_000,
    deductions: 500,
    pf: 0,
    esi: 0,
    professionalTax: 0,
    tds: 0,
    net: 4_500,
    status: 'GENERATED',
    issuedDate: new Date('2026-03-31T00:00:00.000Z'),
  },
  structure: null,
  identifiers: { pfNumber: '', esiNumber: '', panNumber: '' },
};

describe('periodLabel', () => {
  it('names the first and last month of the year', () => {
    expect(periodLabel(1, 2026)).toBe('January 2026');
    expect(periodLabel(12, 2025)).toBe('December 2025');
  });
});

describe('buildPayslipPdf with only the required details', () => {
  it('still renders a complete PDF document', async () => {
    const pdf = await buildPayslipPdf(BARE);
    expect(pdf.subarray(0, 8).toString()).toBe('%PDF-1.7');
    expect(pdf.toString('latin1').trimEnd().endsWith('%%EOF')).toBe(true);
  });

  it('describes itself to an archive with the company, period and employee', async () => {
    const source = (await buildPayslipPdf(BARE)).toString('latin1');
    expect(source).toContain('(Acme)');
    expect(source).toContain('(Salary statement for March 2026)');
    expect(source).toContain('(payslip, salary, March 2026, Sam Lee)');
    expect(source).toContain('(Exyconn Track)');
  });

  it('renders a full payslip with every optional detail and a breakdown', async () => {
    const full: PayslipData = {
      ...BARE,
      company: { ...BARE.company, address: '1 Main St', supportEmail: 'help@acme.test' },
      employee: {
        ...BARE.employee,
        designation: 'A very long designation that has to wrap across more than one line',
        department: 'Engineering',
        joinDate: new Date('2024-01-15T00:00:00.000Z'),
      },
      slip: { ...BARE.slip, gross: 6_000, deductions: 1_100, pf: 300, tds: 200, net: 4_900 },
      structure: { basic: 4_000, hra: 1_000, allowances: 1_000, deductions: 500 },
      identifiers: { pfNumber: 'PF/77', esiNumber: 'ESI/88', panNumber: 'ABCDE1234F' },
    };

    const bare = await buildPayslipPdf(BARE);
    const pdf = await buildPayslipPdf(full);

    expect(pdf.subarray(0, 5).toString()).toBe('%PDF-');
    // More rows drawn, and more glyphs embedded, than the bare payslip needs.
    expect(pdf.length).toBeGreaterThan(bare.length);
  });
});
