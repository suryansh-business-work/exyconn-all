import { ProblemCategory, ProblemSeverity, ProblemStatus } from '@exyconn/shell/graphql/generated';
import type { ProblemReportRow } from '../../../../src/pages/problem-reports/forms/problem-report';

/** A report filed from the public status page. */
export function reportRow(overrides: Partial<ProblemReportRow> = {}): ProblemReportRow {
  return {
    id: 'pr-1',
    reference: 'PR-1042',
    serviceKey: 'portal',
    serviceName: 'Portal',
    category: ProblemCategory.Slowness,
    severity: ProblemSeverity.High,
    status: ProblemStatus.Triaged,
    subject: 'Portal is slow to load',
    description: 'Every page takes more than ten seconds to open since this morning.',
    reporterName: 'Asha Rao',
    reporterEmail: 'asha@example.test',
    pageUrl: 'https://portal.example.test/hr',
    assignee: 'Ravi',
    resolutionNotes: '',
    createdAt: '2026-10-07T09:15:00.000Z',
    ...overrides,
  };
}
