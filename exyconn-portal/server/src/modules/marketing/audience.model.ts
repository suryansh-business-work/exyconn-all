import { Schema, model, type InferSchemaType, type Model } from 'mongoose';

/**
 * Which CRM registers the rules pick recipients from. SELECTED_ONLY turns the rules off and
 * leaves only the records named under Data sources — the shape every list had before rules.
 */
export const RECIPIENT_SOURCES = ['CONTACTS', 'COMPANIES', 'BOTH', 'SELECTED_ONLY'] as const;

/** Where a matching company's addresses come from: its own mailboxes, its people, or both. */
export const COMPANY_EMAIL_SOURCES = ['COMPANY_EMAILS', 'LINKED_CONTACTS', 'BOTH'] as const;

/** How many of a record's addresses are used: one preferred, every eligible one, or by label. */
export const EMAIL_SELECTIONS = ['PRIMARY', 'ALL', 'SELECTED_TYPES'] as const;

/**
 * What a saved audience means later.
 *
 * FIXED_SNAPSHOT freezes the addresses, FIXED_RECORDS freezes the records but reads their
 * latest addresses, DYNAMIC re-runs the rules on every resolution.
 */
export const UPDATE_MODES = ['FIXED_SNAPSHOT', 'FIXED_RECORDS', 'DYNAMIC'] as const;

export const RULE_COMBINATORS = ['AND', 'OR'] as const;

export const RULE_OPERATORS = [
  'EQUALS',
  'NOT_EQUALS',
  'CONTAINS',
  'IS_EMPTY',
  'IS_NOT_EMPTY',
  'NEVER',
  'WITHIN_DAYS',
  'OLDER_THAN_DAYS',
] as const;

export type RecipientSource = (typeof RECIPIENT_SOURCES)[number];
export type CompanyEmailSource = (typeof COMPANY_EMAIL_SOURCES)[number];
export type EmailSelection = (typeof EMAIL_SELECTIONS)[number];
export type UpdateMode = (typeof UPDATE_MODES)[number];
export type RuleCombinator = (typeof RULE_COMBINATORS)[number];
export type RuleOperator = (typeof RULE_OPERATORS)[number];

const conditionSchema = new Schema(
  {
    /** A key from the filter catalogue, e.g. `company.industry`. */
    field: { type: String, required: true, trim: true },
    operator: { type: String, enum: RULE_OPERATORS, required: true },
    value: { type: String, default: '', trim: true },
  },
  { _id: false },
);

/**
 * A saved set of people a campaign can be sent to.
 *
 * Membership is the CRM records the rules match in the chosen registers, plus the records
 * named under Data sources, expanded to email addresses by the selection mode, minus every
 * address that may not be written to — one copy per address, however many records hold it.
 */
const audienceListSchema = new Schema(
  {
    name: { type: String, required: true, unique: true, trim: true },
    description: { type: String, default: '', trim: true },
    recipientSource: { type: String, enum: RECIPIENT_SOURCES, required: true, default: 'BOTH' },
    companyEmailSource: {
      type: String,
      enum: COMPANY_EMAIL_SOURCES,
      required: true,
      default: 'BOTH',
    },
    emailSelection: { type: String, enum: EMAIL_SELECTIONS, required: true, default: 'PRIMARY' },
    /** The address labels used when emailSelection is SELECTED_TYPES, e.g. Sales, Support. */
    emailTypes: { type: [String], default: [] },
    updateMode: { type: String, enum: UPDATE_MODES, required: true, default: 'DYNAMIC' },
    ruleCombinator: { type: String, enum: RULE_COMBINATORS, required: true, default: 'AND' },
    conditions: { type: [conditionSchema], default: [] },
    /** Data sources: records named individually. They skip the rules, never the exclusions. */
    clientIds: { type: [String], default: [] },
    contactIds: { type: [String], default: [] },
    companyIds: { type: [String], default: [] },
    /** Data sources: every active client, re-read on each resolution. */
    allActiveClients: { type: Boolean, required: true, default: false },
    /** Addresses never sent to from this audience, whatever matches them. */
    excludedEmails: { type: [String], default: [] },
    /** When a fixed audience's snapshot was taken; null for a dynamic one. */
    snapshotAt: { type: Date, default: null },
  },
  { timestamps: true },
);

export type AudienceListDocument = InferSchemaType<typeof audienceListSchema>;
export const AudienceListModel: Model<AudienceListDocument> = model<AudienceListDocument>(
  'AudienceList',
  audienceListSchema,
);
