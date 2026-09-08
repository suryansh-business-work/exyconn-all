import type { ProblemReportStatusQuery } from '@exyconn/shell/graphql/generated';

/** What a reporter gets back about their own report. */
export type ReportStatus = ProblemReportStatusQuery['problemReportStatus'];

export interface CheckReportValues {
  reference: string;
}
