import { Schema, model, type InferSchemaType, type Model } from 'mongoose';
import { SUBMISSION_STATUSES } from '../website.constants';

/**
 * A form submitted from the public website. `submissionData` is intentionally
 * free-form: each form type carries a different field set, so it is stored as a
 * document and exposed over the JSON scalar.
 */
const websiteSubmissionSchema = new Schema(
  {
    formType: { type: String, required: true, index: true },
    source: { type: String, default: 'website', trim: true },
    submissionData: { type: Schema.Types.Mixed, required: true, default: {} },
    status: { type: String, required: true, enum: SUBMISSION_STATUSES, default: 'new' },
    notes: { type: String, default: '' },
  },
  { timestamps: true },
);

export type WebsiteSubmissionDocument = InferSchemaType<typeof websiteSubmissionSchema>;
export const WebsiteSubmissionModel: Model<WebsiteSubmissionDocument> =
  model<WebsiteSubmissionDocument>('WebsiteSubmission', websiteSubmissionSchema);
