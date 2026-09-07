import { ProblemReportModel } from './problem-report.model';
import { emailer } from '../email';
import { badRequest } from '../../utils/errors';
import { logger } from '../../utils/logger';
import { allowReport } from './report-rate-limit';

/** The template a reporter is emailed with when their report's status changes. */
export const PROBLEM_REPORT_UPDATE_TEMPLATE = 'problem-report-update';

interface UpdatedReport {
  _id: unknown;
  reference: string;
  status: string;
  serviceName: string;
  reporterName: string;
  reporterEmail: string;
  resolutionNotes: string;
}

/** `IN_PROGRESS` → `In progress`, the way the reporter would say it. */
function statusLabel(status: string): string {
  const words = status.toLowerCase().replaceAll('_', ' ');
  return words.charAt(0).toUpperCase() + words.slice(1);
}

/**
 * Tells the reporter their report moved. Best-effort: the triage is already saved, and
 * a mail outage must not make Tech believe the change was lost.
 */
export async function notifyReporterOfStatus(report: UpdatedReport): Promise<void> {
  if (!report.reporterEmail) {
    return;
  }
  try {
    await emailer.send({
      template: PROBLEM_REPORT_UPDATE_TEMPLATE,
      to: report.reporterEmail,
      variables: {
        name: report.reporterName || 'there',
        reference: report.reference,
        status: statusLabel(report.status),
        serviceName: report.serviceName || 'the platform',
        resolutionNotes: report.resolutionNotes || 'No notes yet — we will update this report.',
      },
      triggeredBy: 'problem report triage',
    });
  } catch (error) {
    logger.error({ err: error }, `Status email for report ${report.reference} failed`);
  }
}

/**
 * Public lookup of one report by its reference. Rate-limited per address like filing
 * one, in its own bucket, and only the fields a reporter already knows come back —
 * never the description or another reporter's details.
 */
export async function problemReportStatus(reference: string, client = 'unknown') {
  if (!allowReport(`status:${client}`)) {
    badRequest('Too many lookups from this connection. Try again in an hour.');
  }
  const report = await ProblemReportModel.findOne({ reference: reference.trim().toUpperCase() })
    .select('reference status serviceName updatedAt')
    .lean();
  if (!report) {
    badRequest('No report matches that reference');
  }
  return {
    reference: report.reference,
    status: report.status,
    serviceName: report.serviceName,
    updatedAt: report.updatedAt,
  };
}
