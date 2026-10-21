import { Schema, model, type InferSchemaType, type Model } from 'mongoose';
import { currencyField } from '../../lib/currencyField';

export const CAMPAIGN_CHANNELS = ['EMAIL', 'SOCIAL', 'SEARCH', 'DISPLAY'] as const;
export const CAMPAIGN_STATUSES = ['PLANNED', 'ACTIVE', 'PAUSED', 'COMPLETED'] as const;

/** What kind of email this is — shown in reports and used to suggest a preference category. */
export const CAMPAIGN_TYPES = [
  'PROMOTIONAL',
  'NEWSLETTER',
  'ANNOUNCEMENT',
  'EVENT',
  'FOLLOW_UP',
  'OTHER',
] as const;

/** How the email body was last edited. VISUAL keeps `blocks` as the source of the MJML. */
export const EDITOR_MODES = ['VISUAL', 'CODE'] as const;

/**
 * Where the email delivery stands, separate from the campaign's marketing `status`.
 * QUEUED and SENDING are owned by the dispatcher; CANCELLED stops what was not yet sent.
 */
export const SEND_STATES = ['DRAFT', 'QUEUED', 'SENDING', 'SENT', 'CANCELLED', 'FAILED'] as const;
export type SendState = (typeof SEND_STATES)[number];

const campaignSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    channel: { type: String, enum: CAMPAIGN_CHANNELS, required: true, default: 'EMAIL' },
    budget: { type: Number, required: true, min: 0 },
    /**
     * The ISO 4217 currency the budget is set in. Campaigns saved before it existed are given
     * the company's at boot (repairStoredCurrencies), so every row has one.
     */
    budgetCurrency: currencyField,
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    status: { type: String, enum: CAMPAIGN_STATUSES, required: true, default: 'PLANNED' },
    // Email-campaign content (used by the Send action for EMAIL channel campaigns).
    subject: { type: String, trim: true, default: '' },
    body: { type: String, default: '' },
    /**
     * A stored email template to render through instead of the raw body. Optional: a
     * one-off blast does not need a template, but a recurring one should look like every
     * other email the company sends, and that lives in Tech > Email.
     */
    templateKey: { type: String, default: '', trim: true },
    // Delivery tracking, set by the sendCampaign mutation.
    lastSentAt: { type: Date, default: null },
    recipientsCount: { type: Number, default: 0 },
    /** When the dispatcher should send this campaign unattended. */
    scheduledAt: { type: Date, default: null },
    /** Who the scheduled send goes to. Without it there is nothing to dispatch. */
    scheduledAudienceListId: { type: String, default: '', trim: true },
    /**
     * Stamped the moment the dispatcher claims the campaign, before it sends anything.
     * That claim is what stops a second tick — or a second process — sending it twice.
     */
    scheduleDispatchedAt: { type: Date, default: null },

    // ── Email Studio ──────────────────────────────────────────────────────────────────────
    campaignType: { type: String, enum: CAMPAIGN_TYPES, required: true, default: 'OTHER' },
    /** The preference category recipients can opt out of; empty = general marketing. */
    preferenceCategoryId: { type: String, default: '', trim: true },
    senderName: { type: String, default: '', trim: true },
    /** Must be a verified sender (the active SMTP configuration's from address). */
    senderEmail: { type: String, default: '', trim: true, lowercase: true },
    replyTo: { type: String, default: '', trim: true, lowercase: true },
    /** The inbox preview line shown after the subject. */
    preheader: { type: String, default: '', trim: true },
    editorMode: { type: String, enum: EDITOR_MODES, required: true, default: 'VISUAL' },
    /** The visual editor's blocks, kept so the design can be reopened. */
    blocks: { type: Schema.Types.Mixed, default: [] },
    /** The draft's MJML source — what the visual editor generates or the code editor holds. */
    mjml: { type: String, default: '' },
    /** The draft compiled, kept for review and the details view. */
    html: { type: String, default: '' },
    /** The plain-text alternative of the draft. */
    text: { type: String, default: '' },
    /** Bumped on every content save, so autosave conflicts and revisions can be told apart. */
    contentVersion: { type: Number, required: true, default: 0 },
    trackOpens: { type: Boolean, required: true, default: true },
    trackClicks: { type: Boolean, required: true, default: true },
    sendState: { type: String, enum: SEND_STATES, required: true, default: 'DRAFT' },
    /** The immutable revision a queued or scheduled send will use. */
    sendingRevisionId: { type: String, default: '', trim: true },
    /** Set by Cancel; the sender stops before its next batch. */
    cancelRequestedAt: { type: Date, default: null },
  },
  { timestamps: true },
);

export type CampaignDocument = InferSchemaType<typeof campaignSchema>;
export const CampaignModel: Model<CampaignDocument> = model<CampaignDocument>(
  'Campaign',
  campaignSchema,
);
