import { Schema, model, type InferSchemaType, type Model } from 'mongoose';

/**
 * The IT team's own configuration — one document per company. Everything the IT screens
 * would otherwise hard-code lives here: the applications access can be asked for, the topics
 * a ticket is triaged under, and how far ahead the dashboard warns about what is expiring.
 *
 * Departments, roles, SLA policies and vendors are NOT here: they already have owners (HR,
 * Admin, Support, Products) and IT reads theirs rather than keeping a second copy.
 */
const itSettingsSchema = new Schema(
  {
    key: { type: String, required: true, default: 'global', trim: true },
    /** Applications an access request may name. */
    applications: { type: [String], default: [] },
    /** Applications every new joiner is given on their first day. */
    onboardingApplications: { type: [String], default: [] },
    /** Topics an IT ticket is triaged under, e.g. Hardware, VPN, Email. */
    ticketTopics: { type: [String], default: [] },
    warrantyWarningDays: { type: Number, required: true, default: 60, min: 1 },
    renewalWarningDays: { type: Number, required: true, default: 30, min: 1 },
    certificateWarningDays: { type: Number, required: true, default: 30, min: 1 },
  },
  { timestamps: true },
);

export type ItSettingsDocument = InferSchemaType<typeof itSettingsSchema>;
export const ItSettingsModel: Model<ItSettingsDocument> = model<ItSettingsDocument>(
  'ItSettings',
  itSettingsSchema,
);
