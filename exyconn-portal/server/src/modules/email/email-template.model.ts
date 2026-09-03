import { Schema, model, type InferSchemaType, type Model } from 'mongoose';

/**
 * One transactional email, authored in the portal rather than compiled into the server.
 *
 * `key` is what code sends by — `emailer.send({ template: 'policy-acknowledged', ... })` —
 * so it is the contract between the codebase and whoever edits the copy. Renaming a key
 * breaks the caller, which is why it is unique and called out in the UI.
 *
 * The variables a template needs are NOT stored: they are read back out of the body every
 * time it is rendered. A hand-maintained list drifts from the markup the moment somebody
 * edits the copy, and then the test form offers fields the template no longer uses.
 */
const emailTemplateSchema = new Schema(
  {
    key: { type: String, required: true, unique: true, trim: true, lowercase: true },
    name: { type: String, required: true, trim: true },
    description: { type: String, default: '', trim: true },
    /** Supports the same `{{variable}}` substitution as the body. */
    subject: { type: String, required: true, trim: true },
    mjml: { type: String, required: true },
    /** An inactive template refuses to send, rather than sending something half-written. */
    isActive: { type: Boolean, required: true, default: true },
    updatedBy: { type: String, default: '', trim: true },
  },
  { timestamps: true },
);

export type EmailTemplateDocument = InferSchemaType<typeof emailTemplateSchema>;
export const EmailTemplateModel: Model<EmailTemplateDocument> = model<EmailTemplateDocument>(
  'EmailTemplate',
  emailTemplateSchema,
);
