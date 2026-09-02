/**
 * Allowed values for the website content fields — mirrors the server's
 * `server/src/constants/../modules/website/website.constants.ts`, which is what
 * Mongoose validates against. Kept in sync by hand, same as `auth/roles.ts`.
 *
 * These are plain display strings rather than GraphQL enums because several values
 * ("Full Time", "AI/ML", "On-site") are not valid GraphQL enum names and the public
 * website renders them verbatim.
 */

export const JOB_CATEGORIES = [
  'Engineering',
  'Design',
  'Marketing',
  'Sales',
  'Product',
  'Operations',
  'Finance',
  'HR',
  'Customer Support',
  'Data Science',
  'AI/ML',
  'DevOps',
  'Content',
  'Legal',
] as const;

export const JOB_TYPES = ['Full Time', 'Part Time', 'Contract', 'Internship', 'Freelance'] as const;

export const EXPERIENCE_LEVELS = [
  'Entry Level',
  'Mid Level',
  'Senior',
  'Lead',
  'Director',
  'Executive',
] as const;

export const WORK_MODES = ['Remote', 'On-site', 'Hybrid'] as const;

export const GIG_CATEGORIES = [
  'Development',
  'Design',
  'Writing',
  'Marketing',
  'Video',
  'Data',
  'AI/ML',
  'Other',
] as const;

export const GIG_DURATIONS = [
  '< 1 week',
  '1-2 weeks',
  '2-4 weeks',
  '1-2 months',
  '2-3 months',
  '3+ months',
  'Flexible (discuss with us)',
] as const;

export const GIG_STATUSES = ['open', 'in-progress', 'completed', 'cancelled'] as const;

export const GIG_APPLICATION_TYPES = ['email', 'form', 'whatsapp'] as const;

export const NAV_CATEGORIES = [
  'General',
  'AI',
  'Services',
  'Case Studies',
  'Company',
  'Products',
  'Tools',
] as const;

export const SUBMISSION_STATUSES = ['new', 'in-review', 'resolved', 'archived'] as const;

/** Maps a readonly constant tuple to `{ label, value }` options for RhfSelect. */
export function toOptions(values: readonly string[]): Array<{ label: string; value: string }> {
  return values.map((value) => ({ label: value, value }));
}
