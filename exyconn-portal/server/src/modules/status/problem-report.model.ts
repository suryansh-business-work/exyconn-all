import { Schema, model, type InferSchemaType, type Model } from 'mongoose';
import { PROBLEM_CATEGORIES, PROBLEM_SEVERITIES, PROBLEM_STATUSES } from './status.constants';
import { newReference } from './reference';

/**
 * A problem reported from the public status page. Anyone can create one (no sign-in),
 * so it lands as its own record with a reference the reporter can quote — the Tech
 * portal triages it from there.
 */
const problemReportSchema = new Schema(
  {
    // Defaulted, not required from the caller: a report logged by Tech from the portal
    // gets the same kind of reference as one filed from the public page.
    reference: { type: String, required: true, unique: true, trim: true, default: newReference },
    serviceKey: { type: String, default: '', trim: true },
    serviceName: { type: String, default: '', trim: true },
    category: { type: String, enum: PROBLEM_CATEGORIES, required: true, default: 'OTHER' },
    severity: { type: String, enum: PROBLEM_SEVERITIES, required: true, default: 'MEDIUM' },
    status: { type: String, enum: PROBLEM_STATUSES, required: true, default: 'NEW' },
    subject: { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true },
    reporterName: { type: String, required: true, trim: true },
    reporterEmail: { type: String, required: true, trim: true, lowercase: true },
    pageUrl: { type: String, default: '', trim: true },
    assignee: { type: String, default: '', trim: true },
    resolutionNotes: { type: String, default: '', trim: true },
  },
  { timestamps: true },
);

export type ProblemReportDocument = InferSchemaType<typeof problemReportSchema>;
export const ProblemReportModel: Model<ProblemReportDocument> = model<ProblemReportDocument>(
  'ProblemReport',
  problemReportSchema,
);
