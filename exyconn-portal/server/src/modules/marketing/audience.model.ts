import { Schema, model, type InferSchemaType, type Model } from 'mongoose';

/**
 * A rule that picks members without anybody maintaining the list.
 *
 * A static list is out of date the moment a contact is added; a segment is re-resolved on
 * every send, so "everyone active" stays true rather than becoming whoever was active on
 * the day the audience was saved.
 */
export const AUDIENCE_SEGMENTS = [
  'NONE',
  'ALL_ACTIVE_CLIENTS',
  'ALL_ACTIVE_CONTACTS',
  'CONTACTS_BY_COMPANY_STATUS',
] as const;

export type AudienceSegment = (typeof AUDIENCE_SEGMENTS)[number];

/**
 * A saved set of people a campaign can be sent to.
 *
 * Before this, every send re-picked its recipients by hand from the full client list —
 * which meant nobody could say afterwards who "the newsletter" actually goes to, and the
 * second send to the same audience was never quite the first one.
 *
 * Membership is three sources merged at send time: named clients, named CRM contacts and
 * one optional segment rule.
 */
const audienceListSchema = new Schema(
  {
    name: { type: String, required: true, unique: true, trim: true },
    description: { type: String, default: '', trim: true },
    /** Clients named individually. */
    clientIds: { type: [String], default: [] },
    /** CRM contacts named individually — most marketing lists are people, not accounts. */
    contactIds: { type: [String], default: [] },
    dynamicSegment: { type: String, enum: AUDIENCE_SEGMENTS, required: true, default: 'NONE' },
    /** The segment's parameter, e.g. the CompanyStatus for CONTACTS_BY_COMPANY_STATUS. */
    segmentValue: { type: String, default: '', trim: true },
  },
  { timestamps: true },
);

export type AudienceListDocument = InferSchemaType<typeof audienceListSchema>;
export const AudienceListModel: Model<AudienceListDocument> = model<AudienceListDocument>(
  'AudienceList',
  audienceListSchema,
);
