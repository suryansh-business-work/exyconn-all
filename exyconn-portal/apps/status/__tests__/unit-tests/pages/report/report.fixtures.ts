import type { MockLink } from '@apollo/client/testing';
import { GraphQLError } from 'graphql';
import {
  ProblemCategory,
  ProblemReportStatusDocument,
  ProblemSeverity,
  ProblemStatus,
  SubmitProblemReportDocument,
} from '@exyconn/shell/graphql/generated';
import type { ReportProblemValues } from '../../../../src/pages/report/forms/report-problem';
import type { ReportStatus } from '../../../../src/pages/report/forms/check-report';

export const REFERENCE = 'EXY-4KQ7W2';

/** A complete report as the schema leaves it after trimming. */
export const reportInput: ReportProblemValues = {
  serviceKey: '',
  category: ProblemCategory.Outage,
  severity: ProblemSeverity.Medium,
  subject: 'Payslips will not load',
  description: 'The payslip list spins forever after signing in.',
  reporterName: 'Ada Lovelace',
  reporterEmail: 'ada@example.com',
  pageUrl: '',
};

export const submitted = (
  input: ReportProblemValues = reportInput,
  error?: Error,
): MockLink.MockedResponse => ({
  request: { query: SubmitProblemReportDocument, variables: { input } },
  ...(error
    ? { error }
    : {
        result: {
          data: {
            submitProblemReport: {
              __typename: 'ProblemReportReceipt',
              reference: REFERENCE,
              submittedAt: '2026-09-07T10:00:00.000Z',
            },
          },
        },
      }),
});

export const reportStatus = (overrides: Partial<ReportStatus> = {}): ReportStatus => ({
  __typename: 'ProblemReportStatus',
  reference: REFERENCE,
  status: ProblemStatus.InProgress,
  serviceName: 'HR Portal',
  updatedAt: '2026-09-07T10:00:00.000Z',
  ...overrides,
});

export const statusLookup = (answer: ReportStatus | null | Error): MockLink.MockedResponse => ({
  request: { query: ProblemReportStatusDocument, variables: { reference: REFERENCE } },
  ...(answer instanceof Error
    ? { error: answer }
    : { result: { data: { problemReportStatus: answer } } }),
});

/** The server answering with a GraphQL error rather than failing at the network. */
export const refusedStatusLookup = (message: string): MockLink.MockedResponse => ({
  request: { query: ProblemReportStatusDocument, variables: { reference: REFERENCE } },
  result: { errors: [new GraphQLError(message)] },
});

/** A mutation answer that carries no data and no error. */
export const submittedWithoutData = (): MockLink.MockedResponse => ({
  request: { query: SubmitProblemReportDocument, variables: { input: reportInput } },
  result: { data: null },
});
