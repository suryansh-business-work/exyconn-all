import { Schema, model, type InferSchemaType, type Model } from 'mongoose';

/**
 * A reusable piece of MJML — a header, a footer, a signature block.
 *
 * Fragments exist so a brand change is one edit rather than one edit per template. A
 * template pulls one in with `{{> fragment-key}}`.
 */
const emailFragmentSchema = new Schema(
  {
    /** Stable id used inside templates. Lower-case kebab; never renamed casually. */
    key: { type: String, required: true, unique: true, trim: true, lowercase: true },
    name: { type: String, required: true, trim: true },
    description: { type: String, default: '', trim: true },
    mjml: { type: String, required: true },
    updatedBy: { type: String, default: '', trim: true },
  },
  { timestamps: true },
);

export type EmailFragmentDocument = InferSchemaType<typeof emailFragmentSchema>;
export const EmailFragmentModel: Model<EmailFragmentDocument> = model<EmailFragmentDocument>(
  'EmailFragment',
  emailFragmentSchema,
);
