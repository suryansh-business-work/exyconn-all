import { Schema, model, type InferSchemaType, type Model } from 'mongoose';

const caseStudySchema = new Schema(
  {
    slug: { type: String, required: true, unique: true, trim: true },
    title: { type: String, required: true, trim: true },
    excerpt: { type: String, default: '', trim: true },
    /** Case-study body as rendered HTML. */
    content: { type: String, default: '' },
    coverImage: { type: String, default: '', trim: true },
    category: { type: String, default: '', trim: true },
    author: { type: String, default: 'Exyconn', trim: true },
    tags: { type: [String], default: [] },
    pdfUrl: { type: String, default: '', trim: true },
    featured: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
    publishedAt: { type: Date, required: true, default: Date.now },
  },
  { timestamps: true },
);

export type CaseStudyDocument = InferSchemaType<typeof caseStudySchema>;
export const CaseStudyModel: Model<CaseStudyDocument> = model<CaseStudyDocument>(
  'CaseStudy',
  caseStudySchema,
);
