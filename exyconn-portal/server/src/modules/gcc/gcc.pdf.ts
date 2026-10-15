import path from 'node:path';
import * as pdfmakeModule from 'pdfmake';
import {
  buildReport,
  calculateEstimate,
  pdfDocument,
  reportText,
  type Estimate,
  type PdfBrand,
} from '@exyconn/gcc-cost';
import { BrandingModel } from '../branding/branding.model';

/**
 * pdfmake's Node entry exports one instance whose methods live on its prototype; the namespace
 * import copies only own keys, so the instance itself is read from `default`.
 */
const pdfmake = (pdfmakeModule as unknown as { default: typeof pdfmakeModule }).default;

/** pdfmake's bundled Roboto faces, the only files a document may read. */
const FONT_DIR = path.join(
  path.dirname(require.resolve('pdfmake/package.json')),
  'fonts',
  'Roboto',
);

pdfmake.setFonts({
  Roboto: {
    normal: path.join(FONT_DIR, 'Roboto-Regular.ttf'),
    bold: path.join(FONT_DIR, 'Roboto-Medium.ttf'),
    italics: path.join(FONT_DIR, 'Roboto-Italic.ttf'),
    bolditalics: path.join(FONT_DIR, 'Roboto-MediumItalic.ttf'),
  },
});
// The document is built from a visitor's estimate: it may not fetch URLs or read other files.
pdfmake.setUrlAccessPolicy(() => false);
pdfmake.setLocalAccessPolicy((file) => path.resolve(file).startsWith(FONT_DIR + path.sep));

/** Secondary ink and table rules: not part of Branding, so fixed here (slate 500 / 200). */
const MUTED = '#64748b';
const RULE = '#e2e8f0';

/** The PDF letterhead from Admin > Branding of the organization in scope. */
async function pdfBrand(): Promise<PdfBrand> {
  const branding = await BrandingModel.findOne().lean();
  return {
    ink: branding?.textColor ?? '#0f172a',
    accent: branding?.primaryColor ?? '#155dfc',
    muted: MUTED,
    rule: RULE,
    businessName: branding?.businessName ?? 'Exyconn',
    websiteUrl: branding?.websiteUrl ?? 'https://exyconn.com',
  };
}

export interface RenderedEstimate {
  pdf: Buffer;
  /** The plain-text summary (headline figures per scenario and the disclaimer). */
  summary: string;
}

/**
 * Recomputes every figure from the estimate's inputs with the shared engine — nothing the
 * browser calculated is trusted — and renders the same report the calculator downloads.
 */
export async function renderEstimate(
  estimate: Estimate,
  now = new Date(),
): Promise<RenderedEstimate> {
  const report = buildReport(estimate, calculateEstimate(estimate), {
    locale: 'en-IN',
    display: 'code',
    generatedOn: now.toISOString().slice(0, 10),
  });
  const pdf = await pdfmake.createPdf(pdfDocument(report, await pdfBrand())).getBuffer();
  return { pdf, summary: reportText(report) };
}
