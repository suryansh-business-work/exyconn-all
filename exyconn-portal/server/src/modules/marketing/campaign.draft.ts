import { z } from 'zod';
import {
  CampaignModel,
  CAMPAIGN_CHANNELS,
  CAMPAIGN_STATUSES,
  CAMPAIGN_TYPES,
  EDITOR_MODES,
} from './marketing.model';
import { compileEmail, loadFooter } from './campaign.render';
import { htmlToText } from './campaign.mjml';
import { badRequest, notFound } from '../../utils/errors';
import { isValidCurrency } from '../../utils/iso';
import { companyProfile } from '../../lib/company';

const DAY_MS = 24 * 60 * 60 * 1000;
const DEFAULT_PERIOD_DAYS = 30;
const MAX_MJML = 500_000;
const MAX_BLOCKS = 200;

const optionalEmail = z.union([z.literal(''), z.email('Enter a valid email address.')]);

/** A draft as the Email Studio autosaves it. Only the name is needed to save a first draft. */
export const campaignDraftSchema = z.object({
  name: z.string().trim().min(1, 'Name the campaign.').max(120),
  channel: z.enum(CAMPAIGN_CHANNELS).default('EMAIL'),
  status: z.enum(CAMPAIGN_STATUSES).default('PLANNED'),
  campaignType: z.enum(CAMPAIGN_TYPES).default('OTHER'),
  preferenceCategoryId: z.string().trim().default(''),
  senderName: z.string().trim().max(100).default(''),
  senderEmail: optionalEmail.default(''),
  replyTo: optionalEmail.default(''),
  subject: z.string().trim().max(255).default(''),
  preheader: z.string().trim().max(200).default(''),
  editorMode: z.enum(EDITOR_MODES).default('VISUAL'),
  /** The visual design: `{ settings, blocks }`. Only its size is checked here; MJML is the source. */
  blocks: z
    .union([z.record(z.string(), z.unknown()), z.array(z.unknown()).max(MAX_BLOCKS)])
    .default([]),
  /** The audience chosen in the Audience step; a send names it again when queued. */
  scheduledAudienceListId: z.string().trim().default(''),
  mjml: z.string().max(MAX_MJML, 'The email is too large.').default(''),
  budget: z.number().min(0).default(0),
  /** Left out, an update keeps the stored one and a new draft takes the company's. */
  budgetCurrency: z
    .string()
    .trim()
    .toUpperCase()
    .refine(isValidCurrency, 'Choose a valid ISO 4217 currency.')
    .optional(),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
  trackOpens: z.boolean().default(true),
  trackClicks: z.boolean().default(true),
});

export type CampaignDraftInput = z.infer<typeof campaignDraftSchema>;

function parseDraft(input: unknown): CampaignDraftInput {
  const parsed = campaignDraftSchema.safeParse(input);
  if (!parsed.success) {
    badRequest(parsed.error.issues[0].message);
  }
  if (parsed.data.startDate && parsed.data.endDate && parsed.data.endDate < parsed.data.startDate) {
    badRequest('The campaign cannot end before it starts.');
  }
  return parsed.data;
}

/** The compiled HTML and text kept with the draft; an MJML error leaves them empty. */
async function compiledParts(draft: CampaignDraftInput) {
  if (!draft.mjml.trim()) {
    return { html: '', text: '' };
  }
  const compiled = await compileEmail(draft, await loadFooter());
  return compiled.issues.length
    ? { html: '', text: '' }
    : { html: compiled.html, text: htmlToText(compiled.html) };
}

/**
 * Creates or updates a draft. `expectedVersion` is the content version the editor last
 * loaded; if somebody saved since, the save is refused instead of overwriting their work.
 */
export async function saveDraft(id: string | null, input: unknown, expectedVersion: number | null) {
  const draft = parseDraft(input);
  const parts = await compiledParts(draft);
  if (!id) {
    const startDate = draft.startDate ?? new Date();
    const created = await CampaignModel.create({
      ...draft,
      ...parts,
      budgetCurrency: draft.budgetCurrency ?? (await companyProfile()).currency,
      startDate,
      endDate: draft.endDate ?? new Date(startDate.getTime() + DEFAULT_PERIOD_DAYS * DAY_MS),
      contentVersion: 1,
    });
    return created.toObject();
  }
  const filter =
    expectedVersion === null ? { _id: id } : { _id: id, contentVersion: expectedVersion };
  // A queued or running send reads the audience it was queued with; editing the draft must
  // not move it. The draft's own copy is kept for the next send.
  const current = await CampaignModel.findById(id).select('sendState').lean();
  const locked = current?.sendState === 'QUEUED' || current?.sendState === 'SENDING';
  const { scheduledAudienceListId, ...content } = draft;
  const changes = locked ? content : { ...content, scheduledAudienceListId };
  const updated = await CampaignModel.findOneAndUpdate(
    filter,
    { $set: { ...changes, ...parts }, $inc: { contentVersion: 1 } },
    { new: true, runValidators: true },
  ).lean();
  if (updated) {
    return updated;
  }
  if (await CampaignModel.exists({ _id: id })) {
    badRequest('This campaign was changed in another window. Reload it to continue.');
  }
  return notFound('Campaign');
}
