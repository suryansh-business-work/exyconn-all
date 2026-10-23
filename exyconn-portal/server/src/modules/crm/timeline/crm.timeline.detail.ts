import { Types } from 'mongoose';
import { ActivityModel } from '../activity.model';
import { DealModel } from '../deal.model';
import { LeadModel } from '../crm.model';
import { WebsiteSubmissionModel } from '../../website/models/submission.model';
import { EmailLogModel } from '../../email/email-log.model';
import { CrmEmailMessageModel } from '../../gmail/gmail.models';
import { WhatsappDemoVisitorModel } from '../../../../../../demos/whatsapp-demo/server/src/visitor/visitor.model';
import { decodeHtmlEntities } from '../../../utils/htmlEntities';
import { notFound } from '../../../utils/errors';
import { belongsTo } from './crm.timeline.filters';
import type { TimelineTarget } from './crm.timeline.types';

type FieldType = 'TEXT' | 'DATE' | 'MONEY';

export interface TimelineField {
  label: string;
  value: string;
  type: FieldType;
}

export interface TimelineDetail {
  fields: TimelineField[];
  body: string;
}

type Value = string | number | Date | null | undefined;

/** A labelled value; dates go out as ISO strings. */
const field = (label: string, value: Value, type: FieldType = 'TEXT'): TimelineField => ({
  label,
  value: value instanceof Date ? value.toISOString() : String(value ?? ''),
  type: value instanceof Date ? 'DATE' : type,
});

/** The fields that hold something: an empty or never-set one is left out of the dialog. */
const detail = (fields: TimelineField[], body: string | null | undefined): TimelineDetail => ({
  fields: fields.filter((one) => one.value !== ''),
  body: body ?? '',
});

const DURATION_MINUTE = 60;

async function gmailDetail(id: string, target: TimelineTarget) {
  const row = await CrmEmailMessageModel.findOne({ _id: id, ...belongsTo.gmail(target) }).lean();
  if (!row) return null;
  return detail(
    [
      field('Subject', row.subject),
      field('From', row.from),
      field('To', row.to.join(', ')),
      field('Cc', row.cc.join(', ')),
      field('Mailbox', row.mailbox),
      field('Date', row.sentAt),
      field('Sent by', row.sentByName),
    ],
    row.bodyText || decodeHtmlEntities(row.snippet),
  );
}

async function activityDetail(id: string, target: TimelineTarget) {
  const row = await ActivityModel.findOne({ _id: id, ...belongsTo.activity(target) }).lean();
  if (!row) return null;
  const minutes = row.durationSeconds ? Math.round(row.durationSeconds / DURATION_MINUTE) : null;
  return detail(
    [
      field('Type', row.type),
      field('Subject', row.subject),
      field('About', row.relatedName),
      field('Owner', row.owner),
      field('Assigned to', row.assigneeName),
      field('Due', row.dueDate),
      field('Reminder', row.remindAt),
      field('Duration (minutes)', minutes),
      field('Logged', row.createdAt),
    ],
    row.notes,
  );
}

async function dealDetail(id: string, target: TimelineTarget) {
  const row = await DealModel.findOne({ _id: id, ...belongsTo.deal(target) }).lean();
  if (!row) return null;
  return detail(
    [
      field('Title', row.title),
      field('Stage', row.stage),
      field('Value', row.value, 'MONEY'),
      field('Probability (%)', row.probability),
      field('Expected close', row.expectedCloseDate),
      field('Company', row.companyName),
      field('Contact', row.contactName),
      field('Owner', row.owner),
    ],
    row.notes,
  );
}

async function leadDetail(id: string, target: TimelineTarget) {
  const row = await LeadModel.findOne({ _id: id, ...belongsTo.lead(target) }).lean();
  if (!row) return null;
  return detail(
    [
      field('Name', row.name),
      field('Email', row.email),
      field('Source', row.source),
      field('Stage', row.stage),
      field('Value', row.value, 'MONEY'),
      field('Campaign', row.campaignName),
      field('Owner', row.owner),
    ],
    row.notes,
  );
}

/** Every answer the visitor typed, except the message, which is the body. */
const answers = (data: Record<string, unknown>) =>
  Object.entries(data).flatMap(([key, value]) =>
    key !== 'message' && (typeof value === 'string' || typeof value === 'number')
      ? [field(key, value)]
      : [],
  );

async function submissionDetail(id: string, target: TimelineTarget) {
  const row = await WebsiteSubmissionModel.findOne({
    _id: id,
    ...belongsTo.submission(target),
  }).lean();
  if (!row) return null;
  const data: Record<string, unknown> = row.submissionData;
  const message = typeof data.message === 'string' ? data.message : '';
  return detail(
    [field('Form', row.formType), field('Status', row.status), ...answers(data)],
    message,
  );
}

/** What was sent, to whom and how it went. The substituted variables stay in Tech > Email. */
async function emailLogDetail(id: string, target: TimelineTarget) {
  const row = await EmailLogModel.findOne({ _id: id, ...belongsTo.emailLog(target) }).lean();
  if (!row) return null;
  return detail(
    [
      field('Subject', row.subject),
      field('To', row.to),
      field('Email', row.templateName),
      field('Status', row.status),
      field('Error', row.error),
      field('Attachments', row.attachments.join(', ')),
      field('Triggered by', row.triggeredBy),
      field('Sent', row.sentAt),
    ],
    '',
  );
}

async function whatsappDetail(id: string, target: TimelineTarget) {
  const row = await WhatsappDemoVisitorModel.findOne({
    _id: id,
    ...belongsTo.whatsapp(target),
  }).lean();
  if (!row) return null;
  return detail(
    [
      field('Name', row.name),
      field('Email', row.email),
      field('Company', row.company),
      field('Phone', row.phone),
      field('Source', row.source),
      field('Verified', row.verifiedAt),
      field('Last sign-in', row.lastSignInAt),
      field('Sign-ins', row.signInCount),
    ],
    '',
  );
}

/** The reader of each entry id prefix (crm.timeline.sources.ts) that opens in a dialog. */
const READERS = new Map<
  string,
  (id: string, target: TimelineTarget) => Promise<TimelineDetail | null>
>([
  ['gmail', gmailDetail],
  ['activity', activityDetail],
  ['deal', dealDetail],
  ['lead', leadDetail],
  ['submission', submissionDetail],
  ['email-log', emailLogDetail],
  ['whatsapp', whatsappDetail],
]);

/**
 * The full record behind one timeline entry (`<source>:<id>`), read only when it belongs to
 * the target — an id from another contact's timeline is not found here.
 */
export async function timelineDetail(
  target: TimelineTarget,
  itemId: string,
): Promise<TimelineDetail> {
  const [source, id = ''] = itemId.split(':');
  const read = READERS.get(source);
  const found = read && Types.ObjectId.isValid(id) ? await read(id, target) : null;
  if (!found) notFound('Timeline entry');
  return found;
}
