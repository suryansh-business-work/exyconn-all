import { WebsiteSubmissionModel } from './models';
import { LeadModel } from '../crm/crm.model';
import { UserModel } from '../admin/user.model';
import { ROLES } from '../../constants/roles';
import { assertRole } from '../../middleware/roleGuard';
import { withId } from '../../utils/serialize';
import { badRequest, notFound } from '../../utils/errors';
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
 * The hand-off from the website inbox to sales. The submission keeps the lead's id so
 * the same enquiry is never filed twice, and a still-new submission moves to in-review
 * because someone has now acted on it.
 */
export const convertWebsiteSubmissionToLead = async (
  _p: unknown,
  { id }: { id: string },
  ctx: GraphQLContext,
) => {
  const user = assertRole(ctx, [ROLES.WEBSITE]);
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
