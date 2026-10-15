import type { ScenarioOutcome } from './compare';
import { formatMoney, type FormatOptions, type Minor } from './money';
import type { Estimate } from './schema';
import { departmentTotals } from './summary';

/**
 * How the numbers are produced, printed in every report. It describes the engine in this
 * package, so it changes only when the engine does.
 */
export const METHODOLOGY = [
  'All amounts are calculated in Indian rupees (INR) in integer paise and converted to the reporting currency at the exchange rates stored with the estimate.',
  'The engine projects 60 months. The forecast window (12, 24, 36 or 60 months) selects which months are totalled.',
  'One-time costs are charged once, in the month they fall due. Refundable security deposits are cash paid out but never a cost: they appear only in the initial cash requirement.',
  'Headcount ramps evenly from each role’s hiring month. Attrition is replaced in the same month and charged recruitment fees, without changing headcount.',
  'With an all-inclusive salary basis no statutory contribution or gratuity is added again.',
  'Taxes are shown separately and before any input-tax credit. Contingency is applied to pre-tax setup and operating cost. Optional add-ons are excluded from totals.',
  'Break-even is only shown when a monthly benefit (savings or revenue) has been entered.',
];

export const DISCLAIMER =
  'This is an indicative planning estimate, not a quotation, an offer, or legal, tax or financial advice. Default values are illustrative assumptions unless a source is cited; replace them with your own figures and confirm legal, tax and statutory items with qualified professionals.';

export interface ReportRow {
  label: string;
  value: string;
}

export interface ReportScenario {
  name: string;
  forecastMonths: number;
  headline: ReportRow[];
  horizons: ReportRow[];
  annual: ReportRow[];
  groups: ReportRow[];
  items: ReportRow[];
  departments: ReportRow[];
  assumptions: ReportRow[];
  reviewItems: string[];
  illustrativeItems: string[];
  issues: string[];
}

export interface ReportModel {
  title: string;
  generatedOn: string;
  reportingCurrency: string;
  company: ReportRow[];
  scenarios: ReportScenario[];
  methodology: readonly string[];
  disclaimer: string;
}

const pct = (value: number | null) => (value === null ? 'Not set' : `${value}%`);

function scenarioReport(
  outcome: ScenarioOutcome,
  format: (minor: Minor) => string,
): ReportScenario {
  const { summary, result } = outcome;
  const { assumptions } = result.scenario;
  const optional = (minor: Minor | null) => (minor === null ? 'Not applicable' : format(minor));
  return {
    name: result.scenario.name,
    forecastMonths: summary.forecastMonths,
    headline: [
      { label: 'One-time setup cost (pre-tax)', value: format(summary.setupCost) },
      { label: 'Refundable deposits', value: format(summary.deposits) },
      { label: 'Initial cash requirement', value: format(summary.initialCash) },
      {
        label: `Monthly operating cost (month ${summary.phaseMonth}, pre-tax)`,
        value: format(summary.monthlyOperating),
      },
      { label: 'Cost per employee per month', value: optional(summary.costPerEmployeeMonthly) },
      { label: 'Taxes in forecast', value: format(summary.tax) },
      { label: 'Contingency in forecast', value: format(summary.contingency) },
      {
        label: `Forecast total (${summary.forecastMonths} months, excl. deposits)`,
        value: format(summary.forecastTotal),
      },
      { label: 'Optional add-ons (excluded)', value: format(summary.optionalTotal) },
      { label: 'Present value of forecast', value: optional(summary.presentValue) },
      {
        label: 'Break-even month',
        value:
          summary.breakEvenMonth === null
            ? 'Not calculated or not reached'
            : `Month ${summary.breakEvenMonth}`,
      },
    ],
    horizons: summary.horizonTotals.map((horizon) => ({
      label: `${horizon.months} months`,
      value: format(horizon.total),
    })),
    annual: summary.annualOperating.map((value, index) => ({
      label: `Year ${index + 1} operating`,
      value: format(value),
    })),
    groups: summary.byGroup.map((group) => ({
      label: `${group.section} · ${group.group}`,
      value: format(group.total),
    })),
    items: summary.byItem.map((item) => ({
      label: `${item.group} · ${item.label}`,
      value: format(item.total),
    })),
    departments: departmentTotals(summary).map((group) => ({
      label: group.group,
      value: format(group.total),
    })),
    assumptions: [
      { label: 'Salary inflation', value: pct(assumptions.salaryInflationPct) },
      { label: 'Technology growth', value: pct(assumptions.techGrowthPct) },
      { label: 'Annual attrition', value: pct(assumptions.attritionPct) },
      { label: 'Contingency', value: pct(assumptions.contingencyPct) },
      { label: 'Working-capital reserve', value: `${assumptions.workingCapitalMonths} months` },
      { label: 'Payment timing', value: assumptions.paymentTiming },
      { label: 'Discount rate', value: pct(assumptions.discountRatePct) },
      { label: 'Office tax rate', value: pct(assumptions.officeTaxPct) },
      { label: 'Technology tax rate', value: pct(assumptions.technologyTaxPct) },
    ],
    reviewItems: summary.reviewItems,
    illustrativeItems: summary.illustrativeItems,
    issues: result.issues.map(
      (issue) => `No exchange rate for ${issue.currency}: an item priced in it is not included.`,
    ),
  };
}

export function buildReport(
  estimate: Estimate,
  outcomes: readonly ScenarioOutcome[],
  options: Pick<FormatOptions, 'locale' | 'display'> & { generatedOn: string },
): ReportModel {
  const format = (minor: Minor) =>
    formatMoney(minor, {
      currency: estimate.reportingCurrency,
      rates: estimate.fxRates,
      locale: options.locale,
      display: options.display,
    });
  const { company } = estimate;
  const companyRows = [
    { label: 'Company', value: company.companyName },
    { label: 'Parent company country', value: company.parentCountry },
    { label: 'Industry', value: company.industry },
    { label: 'GCC purpose', value: company.purpose },
  ].filter((entry) => entry.value !== '');
  const rates = estimate.fxRates.map((rate) => {
    const origin = [rate.userProvided ? 'user-provided' : rate.source, rate.asOf].filter(Boolean);
    return {
      label: `1 ${rate.currency} in INR`,
      value: `${rate.inrPerUnit} (${origin.join(', ')})`,
    };
  });
  return {
    title: estimate.name,
    generatedOn: options.generatedOn,
    reportingCurrency: estimate.reportingCurrency,
    company: [...companyRows, ...rates],
    scenarios: outcomes.map((outcome) => scenarioReport(outcome, format)),
    methodology: METHODOLOGY,
    disclaimer: DISCLAIMER,
  };
}

/** Plain-text summary for copying, native sharing and email bodies. */
export function reportText(report: ReportModel): string {
  const blocks = report.scenarios.map((scenario) =>
    [
      `${scenario.name} — ${scenario.forecastMonths}-month forecast`,
      ...scenario.headline.map((row) => `• ${row.label}: ${row.value}`),
    ].join('\n'),
  );
  return [
    `${report.title} (${report.reportingCurrency}, ${report.generatedOn})`,
    ...blocks,
    report.disclaimer,
  ].join('\n\n');
}
