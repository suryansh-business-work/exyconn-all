import { Schema, model, type InferSchemaType, type Model } from 'mongoose';
import { APPLICANT_SOURCES, APPLICANT_STAGES } from './recruiting.constants';

/**
 * One person applying for one job. Created automatically from the website's
 * job-application form, or by HR for a referral or a walk-in, and moved through the
 * pipeline from HR > Applicants. `notes` is an append-only history, one line per move.
 */
const applicantSchema = new Schema(
  {
    jobCode: { type: String, default: '', trim: true, index: true },
    jobTitle: { type: String, default: '', trim: true },
    companySlug: { type: String, default: '', trim: true },
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true, lowercase: true },
    phone: { type: String, default: '', trim: true },
    resumeUrl: { type: String, default: '', trim: true },
    coverLetter: { type: String, default: '' },
    source: { type: String, enum: APPLICANT_SOURCES, required: true, default: 'MANUAL' },
    stage: { type: String, enum: APPLICANT_STAGES, required: true, default: 'NEW' },
    /** 0 means not rated yet; 1–5 once someone has formed a view. */
    rating: { type: Number, required: true, default: 0, min: 0, max: 5 },
    notes: { type: String, default: '' },
    /** The website submission this applicant was created from, when there was one. */
    submissionId: { type: String, default: '' },
    stageChangedAt: { type: Date, required: true, default: Date.now },
  },
  { timestamps: true },
);

applicantSchema.index({ stage: 1, createdAt: -1 });

export type ApplicantDocument = InferSchemaType<typeof applicantSchema>;
export const ApplicantModel: Model<ApplicantDocument> = model<ApplicantDocument>(
  'Applicant',
  applicantSchema,
);
