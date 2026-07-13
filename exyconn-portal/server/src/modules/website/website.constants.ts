/**
 * Allowed values for the website content enums.
 *
 * These are stored and transmitted as their display strings (e.g. "Full Time",
 * "AI/ML", "On-site") rather than GraphQL enums, because several values are not
 * valid GraphQL enum names and the public website renders them verbatim. Mongoose
 * validates writes against these lists; the portal UI mirrors them in
 * `ui/src/pages/modules/website/website.constants.ts` (same pattern as roles.ts).
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

/** Lifecycle of a form submission received from the public website. */
export const SUBMISSION_STATUSES = ['new', 'in-review', 'resolved', 'archived'] as const;

/** Form identifiers the public website is allowed to submit under. */
export const SUBMISSION_FORM_TYPES = [
  'contact',
  'grievance',
  'legal',
  'career',
  'india-offer',
  'newsletter',
  'job-application',
] as const;

export type JobCategory = (typeof JOB_CATEGORIES)[number];
export type JobType = (typeof JOB_TYPES)[number];
export type ExperienceLevel = (typeof EXPERIENCE_LEVELS)[number];
export type WorkMode = (typeof WORK_MODES)[number];
export type GigCategory = (typeof GIG_CATEGORIES)[number];
export type GigDuration = (typeof GIG_DURATIONS)[number];
export type GigStatus = (typeof GIG_STATUSES)[number];
export type GigApplicationType = (typeof GIG_APPLICATION_TYPES)[number];
export type NavCategory = (typeof NAV_CATEGORIES)[number];
export type SubmissionStatus = (typeof SUBMISSION_STATUSES)[number];
