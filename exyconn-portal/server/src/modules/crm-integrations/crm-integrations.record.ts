import { ROLES } from '../../constants/roles';
import { assertPermission } from '../../lib/permissions';
import type { GraphQLContext } from '../../middleware/auth';
import { badRequest, notFound } from '../../utils/errors';
import { recordAudit } from '../audit';
import { ActivityModel } from '../crm/activity.model';
import { CompanyModel } from '../crm/company.model';
import { ContactModel } from '../crm/contact.model';

export type RecordObject = 'CONTACT' | 'COMPANY';

/** Where integration changes, calls and texts show in Admin > Audit. */
export const CRM_INTEGRATION_MODULE = 'CrmIntegration';

/** National numbers shorter than this cannot be matched to a dialled one with confidence. */
const MIN_MATCH_DIGITS = 7;

interface Phoned {
  _id: unknown;
  name?: string;
  phone?: string | null;
  phones?: Array<{ number: string }> | null;
}

/** Calling or texting a record changes it (its timeline): EDIT on Contact or Company. */
export const assertRecordEdit = (ctx: GraphQLContext, object: RecordObject) =>
  assertPermission(ctx, object === 'CONTACT' ? 'Contact' : 'Company', [ROLES.CRM], 'EDIT');

const digitsOf = (phone: string) => phone.replaceAll(/\D/g, '');
const numbersOf = (row: Phoned) => [row.phone ?? '', ...(row.phones ?? []).map((p) => p.number)];

/**
 * Whether a dialled E.164 number is one stored on the record. Numbers are often saved in
 * national form ("098765 43210"), so a stored number matches when its digits, without leading
 * zeros, end the dialled ones.
 */
export function isRecordNumber(stored: string[], dialled: string): boolean {
  const target = digitsOf(dialled);
  return stored
    .map((number) => digitsOf(number).replace(/^0+/, ''))
    .some((digits) => digits.length >= MIN_MATCH_DIGITS && target.endsWith(digits));
}

/**
 * The record a call or text is for, which must carry the number: the CRM reaches the people
 * in it, never an arbitrary number. A company's numbers include its people's.
 */
export async function recordFor(object: RecordObject, id: string, to: string) {
  const select = 'name phone phones';
  const row =
    object === 'CONTACT'
      ? await ContactModel.findById(id).select(select).lean<Phoned | null>()
      : await CompanyModel.findById(id).select(select).lean<Phoned | null>();
  if (!row) notFound(object === 'CONTACT' ? 'Contact' : 'Company');
  const people =
    object === 'COMPANY'
      ? await ContactModel.find({ companyId: id }).select('phone phones').lean<Phoned[]>()
      : [];
  if (!isRecordNumber([row, ...people].flatMap(numbersOf), to)) {
    badRequest('That number is not on this record. Add it to the record first.');
  }
  return { id, name: row.name ?? '' };
}

export interface ActivityLog {
  object: RecordObject;
  record: { id: string; name: string };
  type: 'CALL' | 'NOTE';
  subject: string;
  notes: string;
  owner: string;
}

/** The call or text on the record's timeline, as a done activity (as LogActivityForm saves). */
export async function logActivity(log: ActivityLog): Promise<string> {
  const row = await ActivityModel.create({
    type: log.type,
    subject: log.subject,
    notes: log.notes,
    relatedType: log.object,
    relatedId: log.record.id,
    relatedName: log.record.name,
    done: true,
    owner: log.owner,
  });
  return row._id.toHexString();
}

/** One audit line naming the record and the provider, never the number or the text. */
export const auditIntegration = (
  ctx: GraphQLContext,
  entity: { id: string; label: string },
  action: 'CREATE' | 'UPDATE' | 'DELETE',
  summary: string,
) =>
  recordAudit(ctx, {
    action,
    module: CRM_INTEGRATION_MODULE,
    entityId: entity.id,
    entityLabel: entity.label,
    summary,
  });
