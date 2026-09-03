import { z } from 'zod';
import { ProblemCategory, ProblemSeverity } from '@exyconn/shell/graphql/generated';

/**
 * Mirrors the server's own checks (`problem-report.service.ts`) so the reporter is
 * told what is wrong before the request is made, and the API stays the authority.
 */
export const reportProblemSchema = z.object({
  serviceKey: z.string(),
  category: z.nativeEnum(ProblemCategory),
  severity: z.nativeEnum(ProblemSeverity),
  subject: z
    .string()
    .trim()
    .min(5, 'Give the problem a short title (at least 5 characters)')
    .max(120, 'Keep the title under 120 characters'),
  description: z
    .string()
    .trim()
    .min(20, 'Tell us what happened — at least 20 characters')
    .max(4000, 'Keep the description under 4000 characters'),
  reporterName: z
    .string()
    .trim()
    .min(2, 'Your name is required')
    .max(80, 'Keep your name under 80 characters'),
  reporterEmail: z
    .string()
    .trim()
    .min(1, 'Email is required')
    .email('Enter a valid email address so we can reply'),
  pageUrl: z
    .string()
    .trim()
    .max(500, 'That URL is too long')
    .refine((url) => url === '' || url.startsWith('http'), {
      message: 'Enter the full address, starting with http',
    }),
});

/** Defaults for a fresh report: platform-wide, a normal bug, medium severity. */
export const REPORT_DEFAULTS: z.infer<typeof reportProblemSchema> = {
  serviceKey: '',
  category: ProblemCategory.Outage,
  severity: ProblemSeverity.Medium,
  subject: '',
  description: '',
  reporterName: '',
  reporterEmail: '',
  pageUrl: '',
};
