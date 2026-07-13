import { Schema, model, type InferSchemaType, type Model } from 'mongoose';
import {
  EXPERIENCE_LEVELS,
  JOB_CATEGORIES,
  JOB_TYPES,
  WORK_MODES,
} from '../website.constants';

const jobSchema = new Schema(
  {
    /** Stable business key from the website data, e.g. "GRP-SM-001". */
    jobCode: { type: String, required: true, unique: true, trim: true },
    /** Slug of the owning JobCompany — matches /career/company/[companySlug]. */
    companySlug: { type: String, required: true, trim: true, index: true },
    title: { type: String, required: true, trim: true },
    category: { type: String, required: true, enum: JOB_CATEGORIES },
    skillSet: { type: [String], default: [] },
    shortJobDescription: { type: String, default: '', trim: true },
    /** Rich-text job description (HTML). */
    jobDescription: { type: String, default: '' },
    /** Rich-text responsibilities section (HTML). */
    jobResponsibilities: { type: String, default: '' },
    requirements: { type: [String], default: [] },
    niceToHave: { type: [String], default: [] },
    benefits: { type: [String], default: [] },
    location: { type: String, default: '', trim: true },
    jobType: { type: String, required: true, enum: JOB_TYPES },
    experienceLevel: { type: String, required: true, enum: EXPERIENCE_LEVELS },
    workMode: { type: String, required: true, enum: WORK_MODES },
    salaryRange: { type: String, default: '', trim: true },
    jobPostDate: { type: Date, required: true, default: Date.now },
    applicationDeadline: { type: Date, default: null },
    isActive: { type: Boolean, default: true },
    isFeatured: { type: Boolean, default: false },
  },
  { timestamps: true },
);

export type JobDocument = InferSchemaType<typeof jobSchema>;
export const JobModel: Model<JobDocument> = model<JobDocument>('Job', jobSchema);
