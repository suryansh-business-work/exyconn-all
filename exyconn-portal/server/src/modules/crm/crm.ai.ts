import { aiDraft, runAssist } from '../ai/ai.actions';
import type { AiActor } from '../ai/ai.service';
import { CrmEmailMessageModel } from '../gmail/gmail.models';
import { ContactModel } from './contact.model';
import { CompanyModel } from './company.model';
import { crmTimeline } from './timeline/crm.timeline';

type CrmObjectKind = 'CONTACT' | 'COMPANY';

/** How much of each earlier email the model reads, so a long thread cannot spend the budget. */
const MESSAGE_CHARS = 1500;
const THREAD_MESSAGES = 6;
const SUMMARY_ITEMS = 40;

/** Who the record is, in a line the model can use to address them. */
async function describe(object: CrmObjectKind, id: string): Promise<string> {
  if (object === 'CONTACT') {
    const contact = await ContactModel.findById(id)
      .select('name title companyName description')
      .lean();
    if (!contact) return '';
    const role = [contact.title, contact.companyName].filter(Boolean).join(' at ');
    return ['Contact:', contact.name, role ? `(${role}).` : '.', contact.description ?? ''].join(
      ' ',
    );
  }
  const company = await CompanyModel.findById(id).select('name industry description').lean();
  if (!company) return '';
  return [
    'Company:',
    company.name,
    company.industry ? `(${company.industry}).` : '.',
    company.description ?? '',
  ].join(' ');
}

/** The last messages of a thread, oldest first, as the model reads them. */
async function threadText(threadId: string): Promise<string> {
  const messages = await CrmEmailMessageModel.find({ threadId })
    .sort({ sentAt: -1 })
    .limit(THREAD_MESSAGES)
    .lean();
  messages.reverse();
  return messages
    .map(
      (m) =>
        `From ${m.from} (${m.sentAt.toISOString()}):\n${(m.bodyText || m.snippet).slice(0, MESSAGE_CHARS)}`,
    )
    .join('\n\n---\n\n');
}

export interface DraftCrmEmailInput {
  object: CrmObjectKind;
  id: string;
  threadId?: string | null;
  /** What the person wants said, e.g. "accept the meeting and share pricing". */
  instruction: string;
}

/** A draft of a new email or of a reply in a thread, written by the AI from the record. */
export async function draftCrmEmail(input: DraftCrmEmailInput, actor: AiActor): Promise<string> {
  const parts = [
    await describe(input.object, input.id),
    input.threadId
      ? `The email thread so far:\n${await threadText(input.threadId)}`
      : 'This is a new email.',
    `What to say: ${input.instruction.trim() || 'a helpful, friendly follow-up'}`,
  ];
  return aiDraft('EMAIL_REPLY', parts.join('\n\n'), actor);
}

/** The AI summary of the relationship: what they asked for, what happened, what is next. */
export async function summariseCrmRecord(
  object: CrmObjectKind,
  id: string,
  actor: AiActor,
): Promise<string> {
  const items = await crmTimeline(object, id, SUMMARY_ITEMS);
  if (items.length === 0) {
    return 'Nothing has happened with this record yet.';
  }
  const history = items
    .map((item) => {
      const detail = item.summary ? ' — ' + item.summary.slice(0, 300) : '';
      return `${item.at.toISOString().slice(0, 10)} ${item.kind}: ${item.title}${detail}`;
    })
    .join('\n');
  const prompt = [
    'Summarise this CRM history for a salesperson in one short paragraph: what they are interested in,',
    'what has happened with them, and what the next step should be. Plain sentences, no headings.',
    '',
    await describe(object, id),
    '',
    'History, newest first:',
    history,
  ].join('\n');
  return runAssist('CRM record summary', prompt, actor);
}
