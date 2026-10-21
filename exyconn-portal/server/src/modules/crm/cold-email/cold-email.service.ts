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
  MAX_BATCH,
  MAX_BODY_CHARS,
  MAX_SUBJECT_CHARS,
  coldEmailPrompt,
  parseColdEmails,
  type ColdEmailText,
} from './cold-email.prompt';

/** The most versions one draft may hold, so regenerating cannot spend the budget unseen. */
export const MAX_VARIANTS = 10;
export const MAX_GOAL_CHARS = 1000;
export const MAX_INSTRUCTION_CHARS = 500;
/** How many versions a new draft, or a rewrite, writes when not told otherwise. */
export const DEFAULT_VARIANT_COUNT = MAX_BATCH;
const CAP_REACHED = `A draft holds at most ${MAX_VARIANTS} versions. Delete one to write another.`;

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
  /** How many versions to write straight away, 1 to MAX_BATCH; 4 when left out. */
  variantCount?: number | null;
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

function checkedCount(count: number | null | undefined): number {
  const value = count ?? DEFAULT_VARIANT_COUNT;
  if (!Number.isInteger(value) || value < 1 || value > MAX_BATCH) {
    badRequest(`Ask for between 1 and ${MAX_BATCH} versions.`);
  }
  return value;
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
  /** Versions to write in the one AI call, 1 to MAX_BATCH. */
  count: number;
}

/** One AI run and the usable versions in its answer. */
async function ask(prompt: string, count: number, author: ColdEmailAuthor) {
  const job = await runAssistJob('Draft cold email', prompt, author);
  return { costUsd: job.costUsd ?? 0, texts: parseColdEmails(job.response).slice(0, count) };
}

/**
 * Versions written by the AI in one call from the record's current business context, each
 * validated. The usable versions are kept (a short answer is accepted); an answer with none is
 * retried once, then a clear error. The run's cost is split across the versions.
 */
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
    count: args.count,
  });
  const first = await ask(prompt, args.count, author);
  // One retry when nothing usable came back; it depends on the first, so it cannot run alongside.
  const retry = first.texts.length === 0 ? await ask(prompt, args.count, author) : null;
  const costUsd = first.costUsd + (retry?.costUsd ?? 0);
  const texts = retry?.texts ?? first.texts;
  if (texts.length === 0) {
    return badRequest('The AI did not return a usable email. Try generating it again.');
  }
  const share = costUsd / texts.length;
  return {
    recordName: business.name,
    variants: texts.map((text) => ({ ...text, costUsd: share })),
  };
}

/** CRM > Cold emails: drafts written by the AI for one record, and sending a chosen version. */
export const coldEmails = {
  get: findDraft,

  /** Writes the first versions (4 by default, in one AI call) and notes it on the timeline. */
  async create(input: CreateColdEmailInput, author: ColdEmailAuthor) {
    const count = checkedCount(input.variantCount);
    const toEmail = await assertRecordAddress(input.object, input.recordId, input.toEmail);
    const goal = bounded(input.goal, MAX_GOAL_CHARS, 'goal');
    const { recordName, variants } = await generate(
      {
        object: input.object,
        recordId: input.recordId,
        goal,
        tone: input.tone,
        instruction: '',
        readWebsite: input.readWebsite === true,
        earlierSubjects: [],
        count,
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
      variants: variants.map((variant) => ({ ...variant, tone: input.tone })),
      createdById: author.id,
      createdByName: author.displayName,
    });
    await logActivity({
      object: input.object,
      record: { id: input.recordId, name: recordName },
      type: 'NOTE',
      subject: 'Cold email drafted',
      notes: `To ${toEmail}: ${variants[0].subject}`,
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
      badRequest(CAP_REACHED);
    }
    const tone = change.tone ?? draft.tone;
    const {
      variants: [variant],
    } = await generate(
      {
        object: draft.object,
        recordId: draft.recordId,
        goal: draft.goal,
        tone,
        instruction: bounded(change.instruction, MAX_INSTRUCTION_CHARS, 'instruction'),
        readWebsite: false,
        earlierSubjects: draft.variants.map((earlier) => earlier.subject),
        count: 1,
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
      badRequest(CAP_REACHED);
    }
    return saved;
  },

  /**
   * Fresh versions from the record's latest data (profile, timeline and, when asked, their
   * website read again), as many as the draft still has room for, up to 4, in one AI call.
   */
  async rewrite(id: string, readWebsite: boolean, author: ColdEmailAuthor) {
    const draft = await findDraft(id);
    const room = MAX_VARIANTS - draft.variants.length;
    if (room <= 0) {
      badRequest(
        `This draft already holds ${MAX_VARIANTS} versions, the most it can. Delete some to rewrite it.`,
      );
    }
    const { variants } = await generate(
      {
        object: draft.object,
        recordId: draft.recordId,
        goal: draft.goal,
        tone: draft.tone,
        instruction: '',
        readWebsite,
        earlierSubjects: draft.variants.map((earlier) => earlier.subject),
        count: Math.min(DEFAULT_VARIANT_COUNT, room),
      },
      author,
    );
    // The cap is checked again in the write, so two rewrites at once cannot pass it.
    const saved = await ColdEmailDraftModel.findOneAndUpdate(
      { _id: id, [`variants.${MAX_VARIANTS - variants.length}`]: { $exists: false } },
      {
        $push: {
          variants: { $each: variants.map((variant) => ({ ...variant, tone: draft.tone })) },
        },
      },
      { new: true },
    ).lean();
    if (!saved) {
      badRequest(CAP_REACHED);
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
