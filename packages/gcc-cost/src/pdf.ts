import type { Content, TDocumentDefinitions } from 'pdfmake/interfaces';
import type { ReportModel, ReportRow, ReportScenario } from './report';

/**
 * The branded PDF report as a pdfmake document definition. Pure data, so the browser (download)
 * and the server (email attachment) render the same document. Amounts are printed with currency
 * codes rather than symbols because the bundled font may not carry every currency's glyph.
 */
export interface PdfBrand {
  /** Colours as hex strings; the caller resolves them from its design tokens. */
  ink: string;
  accent: string;
  muted: string;
  rule: string;
  businessName: string;
  websiteUrl: string;
}

const table = (rows: readonly ReportRow[], brand: PdfBrand): Content =>
  rows.length === 0
    ? { text: 'None', color: brand.muted, margin: [0, 0, 0, 8] }
    : {
        table: {
          widths: ['*', 'auto'],
          body: rows.map((row) => [
            { text: row.label },
            { text: row.value, alignment: 'right', bold: true },
          ]),
        },
        layout: {
          hLineWidth: () => 0.5,
          vLineWidth: () => 0,
          hLineColor: () => brand.rule,
        },
        margin: [0, 0, 0, 10],
      };

const heading = (text: string, brand: PdfBrand): Content => ({
  text,
  style: 'heading',
  color: brand.ink,
  margin: [0, 10, 0, 4],
});

const bullets = (items: readonly string[], brand: PdfBrand): Content =>
  items.length === 0
    ? { text: 'None', color: brand.muted, margin: [0, 0, 0, 8] }
    : { ul: [...items], margin: [0, 0, 0, 8] };

function scenarioContent(scenario: ReportScenario, brand: PdfBrand): Content[] {
  return [
    {
      text: `Scenario: ${scenario.name}`,
      style: 'title',
      color: brand.accent,
      pageBreak: 'before',
    },
    heading('Cost summary', brand),
    table(scenario.headline, brand),
    heading('Forecast totals', brand),
    table(scenario.horizons, brand),
    heading('Operating cost by year', brand),
    table(scenario.annual, brand),
    heading('Cost by category', brand),
    table(scenario.groups, brand),
    heading('Line items', brand),
    table(scenario.items, brand),
    heading('Cost by department', brand),
    table(scenario.departments, brand),
    heading('Assumptions', brand),
    table(scenario.assumptions, brand),
    heading('Items requiring professional review', brand),
    bullets(scenario.reviewItems, brand),
    heading('Items based on illustrative assumptions', brand),
    bullets(scenario.illustrativeItems, brand),
    ...(scenario.issues.length > 0
      ? [heading('Calculation warnings', brand), bullets(scenario.issues, brand)]
      : []),
  ];
}

export function pdfDocument(report: ReportModel, brand: PdfBrand): TDocumentDefinitions {
  return {
    info: { title: report.title, author: brand.businessName, subject: 'GCC cost estimate' },
    pageSize: 'A4',
    pageMargins: [40, 56, 40, 56],
    defaultStyle: { fontSize: 9.5, color: brand.ink, lineHeight: 1.25 },
    styles: {
      title: { fontSize: 18, bold: true, margin: [0, 0, 0, 6] },
      heading: { fontSize: 11.5, bold: true },
    },
    header: {
      text: `${brand.businessName} · GCC cost estimate`,
      margin: [40, 24, 40, 0],
      color: brand.muted,
      fontSize: 8,
    },
    footer: (page: number, pages: number) => ({
      columns: [
        { text: brand.websiteUrl, color: brand.muted },
        { text: `${page} / ${pages}`, alignment: 'right', color: brand.muted },
      ],
      margin: [40, 16, 40, 0],
      fontSize: 8,
    }),
    content: [
      { text: report.title, style: 'title', color: brand.accent },
      {
        text: `Generated ${report.generatedOn} · Reporting currency ${report.reportingCurrency}`,
        color: brand.muted,
        margin: [0, 0, 0, 10],
      },
      heading('Company and exchange rates', brand),
      table(report.company, brand),
      heading('Methodology', brand),
      bullets(report.methodology, brand),
      heading('Disclaimer', brand),
      { text: report.disclaimer, color: brand.muted },
      ...report.scenarios.flatMap((scenario) => scenarioContent(scenario, brand)),
    ],
  };
}
