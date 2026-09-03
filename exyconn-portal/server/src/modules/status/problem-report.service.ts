import { badRequest } from '../../utils/errors';
import { logger } from '../../utils/logger';
import { ProblemReportModel } from './problem-report.model';
import { StatusMonitorModel } from './status-monitor.model';
import { newReference } from './reference';
import { allowReport } from './report-rate-limit';

/** What the public form sends. Every field is re-validated here — the client is untrusted. */
export interface ProblemReportInput {
  serviceKey: string;
  category: string;
  severity: string;
  subject: string;
  description: string;
  reporterName: string;
  reporterEmail: string;
  pageUrl: string;
}

/** Mirrors the Zod schema the form uses, so both surfaces reject the same things. */
const LIMITS = {
  name: { min: 2, max: 80 },
  subject: { min: 5, max: 120 },
  description: { min: 20, max: 4000 },
  pageUrl: { max: 500 },
} as const;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
function assertLength(
  value: string,
  label: string,
  { min = 0, max }: { min?: number; max: number },
) {
  if (value.length < min) {
    badRequest(`${label} must be at least ${min} characters`);
  }
  if (value.length > max) {
    badRequest(`${label} must be at most ${max} characters`);
  }
}

function assertValid(input: ProblemReportInput): void {
  assertLength(input.reporterName, 'Name', LIMITS.name);
  assertLength(input.subject, 'Subject', LIMITS.subject);
  assertLength(input.description, 'Description', LIMITS.description);
  assertLength(input.pageUrl, 'Page URL', LIMITS.pageUrl);
  if (!EMAIL_PATTERN.exec(input.reporterEmail)) {
    badRequest('Enter a valid email address');
  }
}

/** Trims the free text once, so validation and what is stored are the same string. */
function normalize(input: ProblemReportInput): ProblemReportInput {
  return {
    ...input,
    subject: input.subject.trim(),
    description: input.description.trim(),
    reporterName: input.reporterName.trim(),
    reporterEmail: input.reporterEmail.trim().toLowerCase(),
    pageUrl: input.pageUrl.trim(),
  };
}

/**
 * Accepts a report from the public status page and files it for the Tech portal.
 *
 * Unauthenticated by design, so the service name is resolved from the monitor catalogue
 * rather than trusted from the request, and only the reference is handed back — the
 * reporter never sees anyone else's report.
 */
export async function submitProblemReport(raw: ProblemReportInput, client = 'unknown') {
  if (!allowReport(client)) {
    badRequest('Too many reports from this connection. Try again in an hour.');
  }
  const input = normalize(raw);
  assertValid(input);

  const monitor = input.serviceKey
    ? await StatusMonitorModel.findOne({ key: input.serviceKey, isActive: true })
        .select('name')
        .lean()
    : null;
  if (input.serviceKey && !monitor) {
    badRequest('Choose a service from the list');
  }

  const submittedAt = new Date();
  const report = await ProblemReportModel.create({
    ...input,
    serviceName: monitor?.name ?? '',
    reference: newReference(),
    status: 'NEW',
  });
  logger.info(`Problem report ${report.reference} filed for "${report.serviceName || 'platform'}"`);

  return { reference: report.reference, submittedAt };
}
