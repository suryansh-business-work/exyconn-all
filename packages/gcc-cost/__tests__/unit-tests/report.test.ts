import { describe, expect, it } from 'vitest';
import {
  buildReport,
  calculateEstimate,
  csvCell,
  DISCLAIMER,
  estimateCsv,
  pdfDocument,
  reportText,
  type PdfBrand,
} from '../../src';
import { assumptions, estimate, line, role, scenario, usd, usage } from './fixtures';

const brand: PdfBrand = {
  ink: '#111111',
  accent: '#3fa8e6',
  muted: '#666666',
  rule: '#dddddd',
  businessName: 'Exyconn',
  websiteUrl: 'https://exyconn.com',
};

const sample = () =>
  estimate({
    reportingCurrency: 'USD',
    fxRates: [usd, { ...usd, currency: 'GBP', userProvided: false, source: 'ECB', asOf: '' }],
    scenarios: [
      scenario({
        roles: [role({ headcount: 2 })],
        lines: [
          line({ label: '=HYPERLINK("x")', applicability: 'review' }),
          line({
            id: 'extra',
            label: 'Optional extra',
            optional: true,
            source: { kind: 'illustrative', note: '', url: '', checkedOn: '' },
          }),
        ],
        assumptions: assumptions({ contingencyPct: 5, discountRatePct: 10, monthlyBenefit: 1e7 }),
      }),
    ],
  });

describe('CSV export', () => {
  it('quotes cells and defuses spreadsheet formulas', () => {
    expect(csvCell('a"b')).toBe('"a""b"');
    expect(csvCell('=SUM(A1)')).toBe(`"'=SUM(A1)"`);
    expect(csvCell(-5)).toBe(`"'-5"`);
    expect(csvCell(12)).toBe('"12"');
  });

  it('lists every charge in the window with INR and reporting-currency amounts, plus contingency', () => {
    const value = sample();
    const csv = estimateCsv(value, calculateEstimate(value));
    const rows = csv.trim().split('\r\n');
    expect(rows[0]).toBe('"Reporting currency: USD"');
    const salary = rows.find(
      (row) => row.includes('"Salaries"') && row.startsWith('"Standard","1"'),
    );
    expect(salary).toContain('"200000.00"');
    expect(salary).toContain('"2500.00"');
    expect(rows.some((row) => row.includes(`"'=HYPERLINK(""x"")"`))).toBe(true);
    const extra = rows.find((row) => row.includes('"Optional extra"'));
    expect(extra).toContain('"operating","yes","no","yes"');
    expect(rows.filter((row) => row.includes('"Contingency"'))).toHaveLength(12);
    expect(rows.some((row) => row.startsWith('"Standard","13"'))).toBe(false);
  });
});

describe('report', () => {
  it('carries the estimate, scenario figures, assumptions, methodology and disclaimer', () => {
    const value = sample();
    const report = buildReport(value, calculateEstimate(value), {
      locale: 'en-US',
      display: 'code',
      generatedOn: '14 Oct 2026',
    });
    expect(report.title).toBe('Test estimate');
    expect(report.company.map((row) => row.label)).toEqual([
      'Company',
      'Parent company country',
      '1 USD in INR',
      '1 GBP in INR',
    ]);
    expect(report.company[2].value).toBe('80 (user-provided, 2026-10-14)');
    expect(report.company[3].value).toBe('80 (ECB)');
    const [scenarioReport] = report.scenarios;
    expect(
      scenarioReport.headline.find((row) => row.label.startsWith('Present value'))?.value,
    ).toMatch(/USD/);
    expect(scenarioReport.reviewItems).toEqual(['=HYPERLINK("x")']);
    expect(scenarioReport.headline.find((row) => row.label === 'Break-even month')?.value).toBe(
      'Month 1',
    );
    expect(scenarioReport.departments[0].label).toBe('Software Engineering');
    expect(scenarioReport.items.length).toBeGreaterThan(0);
    expect(report.disclaimer).toBe(DISCLAIMER);
    const text = reportText(report);
    expect(text).toContain('Standard — 12-month forecast');
    expect(text).toContain(DISCLAIMER);
  });

  it('reports missing rates and unset values plainly', () => {
    const value = estimate({
      scenarios: [scenario({ ai: { ...scenario().ai, usage: [usage()] } })],
    });
    const report = buildReport(value, calculateEstimate(value), {
      locale: 'en-IN',
      generatedOn: 'today',
    });
    const [scenarioReport] = report.scenarios;
    expect(scenarioReport.issues).toEqual([
      'No exchange rate for USD: an item priced in it is not included.',
    ]);
    expect(scenarioReport.headline.find((row) => row.label === 'Break-even month')?.value).toBe(
      'Not calculated or not reached',
    );
    expect(scenarioReport.assumptions.find((row) => row.label === 'Discount rate')?.value).toBe(
      'Not set',
    );
    expect(scenarioReport.departments).toEqual([]);
  });

  it('builds a PDF document definition with every section', () => {
    const value = sample();
    const report = buildReport(value, calculateEstimate(value), {
      locale: 'en-US',
      display: 'code',
      generatedOn: 'today',
    });
    const definition = pdfDocument(report, brand);
    expect(definition.info?.title).toBe('Test estimate');
    const serialised = JSON.stringify(definition.content);
    for (const heading of [
      'Cost summary',
      'Line items',
      'Cost by department',
      'Assumptions',
      'Methodology',
      'Disclaimer',
    ]) {
      expect(serialised).toContain(heading);
    }
    const footer = definition.footer as (
      page: number,
      pages: number,
    ) => { columns: { text: string }[] };
    expect(footer(2, 5).columns[1].text).toBe('2 / 5');
    const empty = buildReport(estimate(), calculateEstimate(estimate()), {
      locale: 'en-US',
      generatedOn: 'today',
    });
    const emptyContent = JSON.stringify(pdfDocument(empty, brand).content);
    expect(emptyContent).toContain('"None"');
    expect(emptyContent).not.toContain('Calculation warnings');
  });

  it('draws table rules with the brand colour', () => {
    const value = sample();
    const report = buildReport(value, calculateEstimate(value), {
      locale: 'en-US',
      generatedOn: 'today',
    });
    const content = pdfDocument(report, brand).content as {
      layout?: { hLineWidth: () => number; vLineWidth: () => number; hLineColor: () => string };
    }[];
    const tableBlock = content.find((block) => block.layout);
    expect(tableBlock?.layout?.hLineWidth()).toBe(0.5);
    expect(tableBlock?.layout?.vLineWidth()).toBe(0);
    expect(tableBlock?.layout?.hLineColor()).toBe('#dddddd');
    const warnings = buildReport(
      estimate({ scenarios: [scenario({ ai: { ...scenario().ai, usage: [usage()] } })] }),
      calculateEstimate(
        estimate({ scenarios: [scenario({ ai: { ...scenario().ai, usage: [usage()] } })] }),
      ),
      { locale: 'en-US', generatedOn: 'today' },
    );
    expect(JSON.stringify(pdfDocument(warnings, brand).content)).toContain('Calculation warnings');
  });
});
