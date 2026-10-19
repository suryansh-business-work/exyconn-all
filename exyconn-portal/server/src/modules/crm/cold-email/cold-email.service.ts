import { badRequest, notFound } from '../../../utils/errors';
import { runAssistJob } from '../../ai/ai.actions';
import type { AiActor } from '../../ai/ai.service';
import { logActivity } from '../../crm-integrations/crm-integrations.record';
import { sendFromAnyMailbox } from '../../crm-integrations/crm-integrations.email';
import { forCrmUser } from '../../gmail/gmail.client';
import { timelineTarget } from '../timeline/crm.timeline';
import { businessContext, organizationName } from './cold-email.context';
import { ColdEmailDraftModel, type ColdEmailObject, type ColdEmailTone } from './cold-email.model';
import {
  MAX_BODY_CHARS,
  MAX_SUBJECT_CHARS,
  coldEmailPrompt,
  parseColdEmail,
  type ColdEmailText,
} from './cold-email.prompt';

/** The most versions one draft may hold, so regenerating cannot spend the budget unseen. */
export const MAX_VARIANTS = 10;
export const MAX_GOAL_CHARS = 1000;
export const MAX_INSTRUCTION_CHARS = 500;
/** One retry when the model answers with something other than the JSON asked for. */
const ATTEMPTS = 2;

/** Who is writing: the AI budget's owner, and the name the email is signed with. */
export interface ColdEmailAuthor extends AiActor {
  displayName: string;
}

export interface CreateColdEmailInput {
  object: ColdEmailObject;
  recordId: string;
  toEmail: string;
  goal?: string | null;
  tone: ColdEmailTone;
  /** Read their website through Firecrawl first (it costs a Firecrawl call). */
  readWebsite?: boolean | null;
}

export interface SendColdEmailInput {
  draftId: string;
  variantId: string;
  fromAccountId: string;
  subject: string;
  body: string;
}

function bounded(value: string | null | undefined, max: number, label: string): string {
  const text = (value ?? '').trim();
  if (text.length > max) {
    badRequest(`Keep the ${label} under ${max} characters.`);
  }
  return text;
}

function checkedText(subject: string, body: string): ColdEmailText {
  const text = { subject: subject.trim(), body: body.trim() };
  if (text.subject === '' || text.body === '') {
    badRequest('Write a subject and a message.');
  }
  if (text.subject.length > MAX_SUBJECT_CHARS || text.body.length > MAX_BODY_CHARS) {
    badRequest(
      `Keep the subject under ${MAX_SUBJECT_CHARS} and the message under ${MAX_BODY_CHARS} characters.`,
    );
  }
  return text;
}

async function findDraft(id: string) {
  const draft = await ColdEmailDraftModel.findById(id).lean();
  if (!draft) notFound('Cold email draft');
  return draft;
}

/** The address must be one of the record's (a company's include its people's). */
async function assertRecordAddress(object: ColdEmailObject, id: string, toEmail: string) {
  const address = toEmail.trim().toLowerCase();
  const { addresses } = await timelineTarget(object, id, 1);
  if (!addresses.includes(address)) {
    badRequest('That address is not on this record. Add it to the record first.');
  }
  return address;
}

interface GenerateArgs {
  object: ColdEmailObject;
  recordId: string;
  goal: string;
  tone: ColdEmailTone;
  instruction: string;
  readWebsite: boolean;
  earlierSubjects: string[];
}

/** One version written by the AI, validated; one retry on a malformed answer, then a clear error. */
async function generate(args: GenerateArgs, author: ColdEmailAuthor) {
  const [business, organization] = await Promise.all([
    businessContext(args.object, args.recordId, args.readWebsite, author),
    organizationName(),
  ]);
  const prompt = coldEmailPrompt({
    context: business.context,
    recipientName: business.name,
    senderName: author.displayName,
    organizationName: organization,
    goal: args.goal || `an introduction to ${organization} and what we do, asking for a short call`,
    tone: args.tone,
    instruction: args.instruction,
    earlierSubjects: args.earlierSubjects,
  });
  let costUsd = 0;
  for (let attempt = 0; attempt < ATTEMPTS; attempt += 1) {
    const job = await runAssistJob('Draft cold email', prompt, author);
    costUsd += job.costUsd ?? 0;
    const text = parseColdEmail(job.response);
    if (text) {
      return { recordName: business.name, variant: { ...text, costUsd } };
    }
  }
  return badRequest('The AI did not return a usable email. Try generating it again.');
}

/** CRM > Cold emails: drafts written by the AI for one record, and sending a chosen version. */
export const coldEmails = {
  get: findDraft,

  /** Writes the first version and notes the draft on the record's timeline. */
  async create(input: CreateColdEmailInput, author: ColdEmailAuthor) {
    const toEmail = await assertRecordAddress(input.object, input.recordId, input.toEmail);
    const goal = bounded(input.goal, MAX_GOAL_CHARS, 'goal');
    const { recordName, variant } = await generate(
      {
        object: input.object,
        recordId: input.recordId,
        goal,
        tone: input.tone,
        instruction: '',
        readWebsite: input.readWebsite === true,
        earlierSubjects: [],
      },
      author,
    );
    const draft = await ColdEmailDraftModel.create({
      object: input.object,
      recordId: input.recordId,
      recordName,
      toEmail,
      goal,
      tone: input.tone,
      variants: [{ ...variant, tone: input.tone }],
      createdById: author.id,
      createdByName: author.displayName,
    });
    await logActivity({
      object: input.object,
      record: { id: input.recordId, name: recordName },
      type: 'NOTE',
      subject: 'Cold email drafted',
      notes: `To ${toEmail}: ${variant.subject}`,
      owner: author.displayName,
    });
    return draft.toObject();
  },

  /** Another version, optionally steered by an instruction or a different tone. */
  async addVariant(
    id: string,
    change: { instruction?: string | null; tone?: ColdEmailTone | null },
    author: ColdEmailAuthor,
  ) {
    const draft = await findDraft(id);
    if (draft.variants.length >= MAX_VARIANTS) {
      badRequest(`A draft holds at most ${MAX_VARIANTS} versions. Delete one to write another.`);
    }
    const tone = change.tone ?? draft.tone;
    const { variant } = await generate(
      {
        object: draft.object,
        recordId: draft.recordId,
        goal: draft.goal,
        tone,
        instruction: bounded(change.instruction, MAX_INSTRUCTION_CHARS, 'instruction'),
        readWebsite: false,
        earlierSubjects: draft.variants.map((earlier) => earlier.subject),
      },
      author,
    );
    const instruction = (change.instruction ?? '').trim();
    const saved = await ColdEmailDraftModel.findOneAndUpdate(
      { _id: id, [`variants.${MAX_VARIANTS - 1}`]: { $exists: false } },
      { $push: { variants: { ...variant, tone, instruction } } },
      { new: true },
    ).lean();
    if (!saved) {
      badRequest(`A draft holds at most ${MAX_VARIANTS} versions. Delete one to write another.`);
    }
    return saved;
  },

  /** The person's own edit of a version that has not gone out yet. */
  async updateVariant(draftId: string, variantId: string, subject: string, body: string) {
    const text = checkedText(subject, body);
    const saved = await ColdEmailDraftModel.findOneAndUpdate(
      { _id: draftId, variants: { $elemMatch: { _id: variantId, sentAt: null } } },
      { $set: { 'variants.$.subject': text.subject, 'variants.$.body': text.body } },
      { new: true },
    ).lean();
    if (!saved) {
      badRequest('That version was sent or no longer exists, so it cannot be edited.');
    }
    return saved;
  },

  /** Removes an unsent version; the last one stays (delete the draft instead). */
  async deleteVariant(draftId: string, variantId: string) {
    const draft = await findDraft(draftId);
    if (draft.variants.length <= 1) {
      badRequest('This is the only version. Delete the draft instead.');
    }
    const saved = await ColdEmailDraftModel.findOneAndUpdate(
      { _id: draftId, variants: { $elemMatch: { _id: variantId, sentAt: null } } },
      { $pull: { variants: { _id: variantId } } },
      { new: true },
    ).lean();
    if (!saved) {
      badRequest('That version was sent or no longer exists, so it cannot be deleted.');
    }
    return saved;
  },

  async remove(id: string) {
    const removed = await ColdEmailDraftModel.findByIdAndDelete(id).lean();
    if (!removed) notFound('Cold email draft');
    return removed;
  },

  /**
   * Sends one version from a CRM mailbox. The version is claimed first, so a double click
   * cannot send it twice; a failed send releases it. The sent message is kept by the mail
   * module (Emails tab and timeline) and linked from the version.
   */
  async send(input: SendColdEmailInput, sentByName: string) {
    const text = checkedText(input.subject, input.body);
    const draft = await findDraft(input.draftId);
    const claimed = await ColdEmailDraftModel.findOneAndUpdate(
      { _id: input.draftId, variants: { $elemMatch: { _id: input.variantId, sentAt: null } } },
      { $set: { 'variants.$.sentAt': new Date() } },
    ).lean();
    if (!claimed) {
      badRequest('That version was already sent or no longer exists.');
    }
    const release = () =>
      ColdEmailDraftModel.updateOne(
        { _id: input.draftId, 'variants._id': input.variantId },
        { $set: { 'variants.$.sentAt': null } },
      );
    try {
      const result = await forCrmUser(() =>
        sendFromAnyMailbox(
          { fromAccountId: input.fromAccountId, to: [draft.toEmail], ...text },
          sentByName,
        ),
      );
      const saved = await ColdEmailDraftModel.findOneAndUpdate(
        { _id: input.draftId, 'variants._id': input.variantId },
        {
          $set: {
            status: 'SENT',
            'variants.$.subject': text.subject,
            'variants.$.body': text.body,
            'variants.$.sentMessageId': result.sent.gmailId,
          },
        },
        { new: true },
      ).lean();
      return { draft: saved ?? draft, ...result };
    } catch (error) {
      await release();
      throw error;
    }
  },
};
