import { z } from 'zod';
import { ProblemCategory, ProblemSeverity, ProblemStatus } from '@exyconn/shell/graphql/generated';
import type { ProblemReportRow } from './problem-report.types';

/**
 * Covers both ways a report is created: filed by the public form, or logged here by
 * Tech for someone who phoned in. The reporter's fields are validated exactly as the
 * public status page validates them, so both routes hold the same standard.
 */
export const problemReportSchema = z
  .object({
    serviceKey: z.string(),
    category: z.nativeEnum(ProblemCategory),
    severity: z.nativeEnum(ProblemSeverity),
    status: z.nativeEnum(ProblemStatus),
    subject: z
      .string()
      .trim()
      .min(5, 'Title is required')
      .max(120, 'Keep the title under 120 characters'),
    description: z
      .string()
      .trim()
      .min(20, 'Describe the problem — at least 20 characters')
      .max(4000, 'Keep the description under 4000 characters'),
    reporterName: z.string().trim().min(2, 'Reporter name is required').max(80, 'Name is too long'),
    reporterEmail: z.string().trim().min(1, 'Email is required').email('Enter a valid email'),
    pageUrl: z.string().trim().max(500, 'That URL is too long'),
    assignee: z.string().trim().max(80, 'Keep the assignee under 80 characters'),
    resolutionNotes: z.string().trim().max(4000, 'Keep the notes under 4000 characters'),
  })
  // Closing a report with nothing written down loses why it was closed, so it is
  // rejected here rather than discovered months later.
  .refine((values) => !isFinished(values.status) || values.resolutionNotes.length > 0, {
    message: 'Say what was done before resolving or closing',
    path: ['resolutionNotes'],
  });

type Values = z.infer<typeof problemReportSchema>;

/** Resolved or closed — the states that must carry an explanation. */
export function isFinished(status: string): boolean {
  return status === ProblemStatus.Resolved || status === ProblemStatus.Closed;
}

/** Maps the validated values onto the GraphQL input, naming the service from its key. */
export function toProblemReportInput(values: Values, nameFor: (key: string) => string) {
  return { ...values, serviceName: values.serviceKey ? nameFor(values.serviceKey) : '' };
}

export function toProblemReportValues(row: ProblemReportRow | null): Values {
  return {
    serviceKey: row?.serviceKey ?? '',
    category: row?.category ?? ProblemCategory.Outage,
    severity: row?.severity ?? ProblemSeverity.Medium,
    status: row?.status ?? ProblemStatus.New,
    subject: row?.subject ?? '',
    description: row?.description ?? '',
    reporterName: row?.reporterName ?? '',
    reporterEmail: row?.reporterEmail ?? '',
    pageUrl: row?.pageUrl ?? '',
    assignee: row?.assignee ?? '',
    resolutionNotes: row?.resolutionNotes ?? '',
  };
}
