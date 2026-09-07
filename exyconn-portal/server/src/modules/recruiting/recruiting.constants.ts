/** Where an applicant came from. WEBSITE rows are created by the job-application form. */
export const APPLICANT_SOURCES = ['WEBSITE', 'REFERRAL', 'MANUAL'] as const;
export type ApplicantSource = (typeof APPLICANT_SOURCES)[number];

/** The hiring pipeline, in order. HIRED and REJECTED are terminal. */
export const APPLICANT_STAGES = [
  'NEW',
  'SCREENING',
  'INTERVIEW',
  'OFFER',
  'HIRED',
  'REJECTED',
] as const;
export type ApplicantStage = (typeof APPLICANT_STAGES)[number];

/** Stages the applicant is emailed about; an internal move (screening) is silent. */
export const NOTIFIED_STAGES: ReadonlySet<ApplicantStage> = new Set(['INTERVIEW', 'OFFER', 'REJECTED']);

/** The website form's field name for the job's business key. */
export const JOB_APPLICATION_FORM_TYPE = 'job-application';
