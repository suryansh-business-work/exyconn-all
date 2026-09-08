import { ApplicantModel } from './applicant.model';
import { JobModel } from '../website/models';
import { emailer } from '../email';
import { notFound } from '../../utils/errors';
import { logger } from '../../utils/logger';
import { NOTIFIED_STAGES, type ApplicantStage } from './recruiting.constants';

type Payload = Record<string, unknown>;

/** The template an applicant is emailed with on a stage change. Authored in Tech → Email. */
export const APPLICANT_STAGE_TEMPLATE = 'applicant-stage';

/** The first non-empty string among the keys the form might have used for one fact. */
function firstText(data: Payload, keys: readonly string[]): string {
  for (const key of keys) {
    const value = data[key];
    if (typeof value === 'string' && value.trim()) {
      return value.trim();
    }
  }
  return '';
}

function nameOf(data: Payload): string {
  const name = firstText(data, ['name', 'fullName']);
  if (name) {
    return name;
  }
  return [data.firstName, data.lastName]
    .filter((part): part is string => typeof part === 'string' && part.trim() !== '')
    .join(' ')
    .trim();
}

/** Extra facts the website form collects that have no column of their own. */
const DETAIL_KEYS = [
  'location',
  'experience',
  'noticePeriod',
  'currentCTC',
  'expectedCTC',
  'linkedin',
  'portfolio',
  'referral',
] as const;

function detailLines(data: Payload): string[] {
  return DETAIL_KEYS.map((key) => [key, firstText(data, [key])] as const)
    .filter(([, value]) => value !== '')
    .map(([key, value]) => `${key}: ${value}`);
}

/** Maps the job-application payload onto an applicant row. Exported for the unit test. */
export function applicantFromSubmission(data: Payload, submissionId: string, jobTitle: string) {
  return {
    jobCode: firstText(data, ['jobCode', 'jobId']),
    jobTitle: jobTitle || firstText(data, ['jobTitle']),
    companySlug: firstText(data, ['companySlug']),
    name: nameOf(data),
    email: firstText(data, ['email']).toLowerCase(),
    phone: firstText(data, ['phone']),
    resumeUrl: firstText(data, ['resumeUrl', 'resumeLink', 'resume', 'resumeName']),
    coverLetter: firstText(data, ['coverLetter']),
    source: 'WEBSITE',
    stage: 'NEW',
    submissionId,
    notes: ['Applied through the website job-application form.', ...detailLines(data)].join('\n'),
  };
}

/**
 * Files an applicant from a website job-application submission. The job title comes
 * from the Job catalogue when the code is known, so a renamed posting still files under
 * the name HR sees in the portal.
 */
export async function createApplicantFromSubmission(submissionId: string, data: Payload) {
  const jobCode = firstText(data, ['jobCode', 'jobId']);
  const job = jobCode ? await JobModel.findOne({ jobCode }).select('title').lean() : null;
  return ApplicantModel.create(applicantFromSubmission(data, submissionId, job?.title ?? ''));
}

const STAGE_MESSAGES: Partial<Record<ApplicantStage, string>> = {
  INTERVIEW:
    'We would like to invite you to an interview. We will be in touch shortly to arrange a time.',
  OFFER: 'We are pleased to offer you the position. The full details will follow separately.',
  REJECTED:
    'After careful consideration we will not be taking your application further this time. Thank you for your interest.',
};

function stageLabel(stage: ApplicantStage): string {
  return stage.charAt(0) + stage.slice(1).toLowerCase();
}

/**
 * Tells the applicant where they stand. Best-effort: the stage is already saved, and a
 * mail server that is down must not undo a hiring decision.
 */
async function notifyApplicant(applicant: {
  _id: unknown;
  name: string;
  email: string;
  jobTitle: string;
  stage: ApplicantStage;
}): Promise<void> {
  try {
    await emailer.send({
      template: APPLICANT_STAGE_TEMPLATE,
      to: applicant.email,
      variables: {
        name: applicant.name,
        jobTitle: applicant.jobTitle || 'the role you applied for',
        stageLabel: stageLabel(applicant.stage),
        message: STAGE_MESSAGES[applicant.stage] ?? '',
      },
      triggeredBy: 'recruiting pipeline',
    });
  } catch (error) {
    logger.error({ err: error }, `Stage email for applicant ${String(applicant._id)} failed`);
  }
}

/**
 * Moves an applicant to a stage, stamps when, and appends the move to the notes history.
 * Stages the applicant should hear about are emailed after the save.
 */
export async function setApplicantStage(
  id: string,
  stage: ApplicantStage,
  note: string,
  actor: string,
) {
  const applicant = await ApplicantModel.findById(id);
  if (!applicant) {
    notFound('Applicant');
  }
  const at = new Date();
  const line = [`${at.toISOString()} · ${stageLabel(stage)} by ${actor}`, note.trim()]
    .filter(Boolean)
    .join(' — ');
  applicant.stage = stage;
  applicant.stageChangedAt = at;
  applicant.notes = [applicant.notes, line].filter(Boolean).join('\n');
  await applicant.save();

  if (NOTIFIED_STAGES.has(stage)) {
    await notifyApplicant(applicant);
  }
  return applicant.toObject();
}
