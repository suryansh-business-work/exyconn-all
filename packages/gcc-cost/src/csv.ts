import type { Charge } from './charges';
import type { ScenarioOutcome } from './compare';
import { convertFromInr } from './money';
import type { Estimate } from './schema';

/** Quotes a CSV cell and defuses spreadsheet formulas (a cell may not start with = + - @). */
export function csvCell(value: string | number): string {
  const text = String(value);
  const safe = /^[=+\-@\t\r]/.test(text) ? `'${text}` : text;
  return `"${safe.replaceAll('"', '""')}"`;
}

const row = (cells: readonly (string | number)[]) => cells.map(csvCell).join(',');

const HEADER = [
  'Scenario',
  'Month',
  'Section',
  'Group',
  'Item',
  'Kind',
  'Optional',
  'Needs review',
  'Illustrative assumption',
  'Amount (INR)',
  'Tax (INR)',
  'Amount (reporting currency)',
  'Tax (reporting currency)',
];

/** A charge as a CSV row; contingency rows reuse it with their own section name. */
type CsvItem = Omit<Charge, 'section' | 'sourceId'> & { section: string };

function chargeRow(estimate: Estimate, scenarioName: string, item: CsvItem): string {
  const money = (minor: number) =>
    convertFromInr(minor, estimate.reportingCurrency, estimate.fxRates).toFixed(2);
  return row([
    scenarioName,
    item.month,
    item.section,
    item.group,
    item.label,
    item.kind,
    item.optional ? 'yes' : 'no',
    item.review ? 'yes' : 'no',
    item.illustrative ? 'yes' : 'no',
    (item.amount / 100).toFixed(2),
    (item.tax / 100).toFixed(2),
    money(item.amount),
    money(item.tax),
  ]);
}

/**
 * Every charge of every scenario inside its forecast window, one row per month and item, with
 * INR and reporting-currency amounts. Contingency is a separate row per month.
 */
export function estimateCsv(estimate: Estimate, outcomes: readonly ScenarioOutcome[]): string {
  const lines = [row([`Reporting currency: ${estimate.reportingCurrency}`]), row(HEADER)];
  for (const { result, summary } of outcomes) {
    const name = result.scenario.name;
    const charges = result.charges
      .filter((item) => item.month <= summary.forecastMonths)
      .toSorted((a, b) => a.month - b.month);
    lines.push(...charges.map((item) => chargeRow(estimate, name, item)));
    const contingency = result.months
      .filter((month) => month.month <= summary.forecastMonths && month.contingency > 0)
      .map((month) =>
        chargeRow(estimate, name, {
          section: 'contingency',
          group: 'Contingency',
          label: 'Contingency',
          month: month.month,
          kind: 'operating',
          amount: month.contingency,
          tax: 0,
          optional: false,
          review: false,
          illustrative: false,
        }),
      );
    lines.push(...contingency);
  }
  return `${lines.join('\r\n')}\r\n`;
}
