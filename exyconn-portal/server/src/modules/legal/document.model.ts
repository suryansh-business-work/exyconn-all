import { Schema, model, type InferSchemaType, type Model } from 'mongoose';

export const DOCUMENT_CATEGORIES = ['POLICY', 'CONTRACT', 'COMPLIANCE', 'OTHER'] as const;
export const DOCUMENT_STATUSES = ['DRAFT', 'FINAL', 'ARCHIVED'] as const;

/** A legal document record stored in the Documents repository. */
const documentSchema = new Schema(
  {
    title: { type: String, required: true, trim: true },
    category: { type: String, enum: DOCUMENT_CATEGORIES, required: true, default: 'OTHER' },
    owner: { type: String, trim: true, default: null },
    fileUrl: { type: String, trim: true, default: null },
    status: { type: String, enum: DOCUMENT_STATUSES, required: true, default: 'DRAFT' },
  },
  { timestamps: true },
);

export type LegalDocumentDocument = InferSchemaType<typeof documentSchema>;
export const LegalDocumentModel: Model<LegalDocumentDocument> = model<LegalDocumentDocument>(
  'LegalDocument',
  documentSchema,
);
