import { WebsiteSubmissionModel } from './models';
import { LeadModel } from '../crm/crm.model';
import { UserModel } from '../admin/user.model';
import { ROLES } from '../../constants/roles';
import { assertPlatformStaff } from '../../lib/platformAccess';
import { withId } from '../../utils/serialize';
import { badRequest, notFound } from '../../utils/errors';
import { logger } from '../../utils/logger';
import type { GraphQLContext } from '../../middleware/auth';

type Payload = Record<string, unknown>;

/** The first non-empty string among the keys a form might have used for one fact. */
function firstText(data: Payload, keys: readonly string[]): string {
  for (const key of keys) {
    const value = data[key];
    if (typeof value === 'string' && value.trim()) {
      return value.trim();
    }
  }
  return '';
}

/**
 * What the seven website forms call the same things. Contact and job-application split
 * the name; india-offer says `business`; legal calls its message `details`.
 */
const NAME_KEYS = ['name', 'fullName'] as const;
const COMPANY_KEYS = ['company', 'companyName', 'business'] as const;
const MESSAGE_KEYS = ['message', 'details', 'coverLetter', 'subject'] as const;

function nameOf(data: Payload): string {
  const name = firstText(data, NAME_KEYS);
  if (name) {
    return name;
  }
  return [data.firstName, data.lastName]
    .filter((part): part is string => typeof part === 'string' && part.trim() !== '')
    .join(' ')
    .trim();
}

/** The lead's notes: what was written, and where, so the salesperson has the context. */
function notesOf(formType: string, data: Payload): string {
  const lines = [`From the website ${formType} form.`];
  const message = firstText(data, MESSAGE_KEYS);
  const company = firstText(data, COMPANY_KEYS);
  const phone = firstText(data, ['phone']);
  if (company) lines.push(`Company: ${company}`);
  if (phone) lines.push(`Phone: ${phone}`);
  if (message) lines.push('', message);
  return lines.join('\n');
}

/** Maps a form payload onto the lead the CRM will file. Exported for the unit test. */
export function leadFromSubmission(formType: string, data: Payload, owner: string) {
  const email = firstText(data, ['email']).toLowerCase();
  if (!email) {
    badRequest('This submission has no email address, so it cannot become a lead.');
  }
  return {
    name: nameOf(data) || email,
    email,
    source: 'WEBSITE',
    stage: 'NEW',
    value: 0,
    owner,
    notes: notesOf(formType, data),
  };
}

/**
 * The enquiries that are a sales lead by their nature.
 *
 * A "contact us" and an "India offer" enquiry are somebody asking to be sold to; a
 * grievance, a legal notice, a job application and a newsletter sign-up are not, and filing
 * those as leads would put complaints and candidates into a sales pipeline. Anything else
 * can still be handed over by hand from the inbox.
 */
const SALES_FORM_TYPES: ReadonlySet<string> = new Set(['contact', 'india-offer']);

/** What an automatically filed lead's owner reads as until the desk picks it up. */
export const UNASSIGNED = 'Unassigned';

/**
 * Files a lead the moment a sales enquiry arrives.
 *
 * The inbox always had a "convert to lead" button, which means an enquiry that came in on
 * Friday evening waited for somebody to open a screen — and an enquiry nobody opened was an
 * enquiry nobody answered. Best-effort: a submission is never lost because the CRM refused
 * it, and the button still works for whatever this leaves alone.
 */
export async function autoFileLead(
  submissionId: string,
  formType: string,
  data: Payload,
): Promise<string | null> {
  if (!SALES_FORM_TYPES.has(formType)) {
    return null;
  }
  const email = firstText(data, ['email']).toLowerCase();
  if (!email) {
    return null;
  }
  try {
    // Named "Unassigned" rather than left blank: a lead has to have an owner, and putting a
    // real person's name on one nobody has picked up would say somebody had. Assignment is
    // the sales desk's own decision, and this is what it reads as until they make it.
    const lead = await LeadModel.create(leadFromSubmission(formType, data, UNASSIGNED));
    const leadId = String(lead._id);
    await WebsiteSubmissionModel.updateOne({ _id: submissionId }, { leadId });
    return leadId;
  } catch (error) {
    logger.error(error, `Submission ${submissionId} could not be filed as a lead`);
    return null;
  }
}

/**
 * The hand-off from the website inbox to sales. The submission keeps the lead's id so
 * the same enquiry is never filed twice, and a still-new submission moves to in-review
 * because someone has now acted on it.
 */
export const convertWebsiteSubmissionToLead = async (
  _p: unknown,
  { id }: { id: string },
  ctx: GraphQLContext,
) => {
  // The inbox is exyconn.com's, so only the platform operator's staff hand it to sales.
  const user = await assertPlatformStaff(ctx, 'WebsiteSubmission', [ROLES.WEBSITE], 'EDIT');
  const submission = await WebsiteSubmissionModel.findById(id);
  if (!submission) {
    notFound('Submission');
  }
  if (submission.leadId) {
    const existing = await LeadModel.findById(submission.leadId).lean();
    const label = existing ? `"${existing.name}"` : submission.leadId;
    badRequest(`This submission was already converted to lead ${label}.`);
  }

  const converter = await UserModel.findById(user.id).select('name').lean();
  const owner = converter?.name ?? user.email;
  const data = (submission.submissionData ?? {}) as Payload;
  const lead = await LeadModel.create(leadFromSubmission(submission.formType, data, owner));

  submission.leadId = String(lead._id);
  if (submission.status === 'new') {
    submission.status = 'in-review';
  }
  await submission.save();

  return withId(lead.toObject());
};
