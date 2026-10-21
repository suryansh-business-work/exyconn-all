import { companyProfile } from '../../lib/company';
import { currentOrganizationId, runAsPlatform } from '../../lib/tenant';
import { OrganizationModel } from '../organizations/organization.model';
import { buildHoursReport } from './tracker.report.data';
import { buildHoursReportPdf } from './tracker.report.pdf';

/** The company's name and language, for the report's header and its dates and money. */
export async function reportBranding(): Promise<{ locale: string; company: string }> {
  const profile = await companyProfile();
  const organizationId = currentOrganizationId();
  const organization = organizationId
    ? await runAsPlatform(() => OrganizationModel.findById(organizationId).select('name').lean())
    : null;
  return { locale: profile.locale, company: organization?.name ?? '' };
}

/** A file name made of words a file system accepts everywhere. */
function fileNameOf(name: string, from: string): string {
  const slug = name
    .toLowerCase()
    .replaceAll(/[^a-z\d]+/g, '-')
    .replaceAll(/^-|-$/g, '');
  return `${slug || 'employee'}-${from.slice(0, 10)}-hours.pdf`;
}

/** One employee's hours over a range as a PDF, in the shape GraphQL's `TableFile` returns. */
export async function hoursReportPdfFile(userId: string, from: Date, to: Date, timezone: string) {
  const [report, branding] = await Promise.all([
    buildHoursReport(userId, from, to, timezone),
    reportBranding(),
  ]);
  const pdf = await buildHoursReportPdf(report, branding);
  return {
    fileName: fileNameOf(report.employee.name, report.from),
    mimeType: 'application/pdf',
    contentBase64: pdf.toString('base64'),
    rowCount: report.days.length,
  };
}
