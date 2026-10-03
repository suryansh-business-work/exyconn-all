import { Schema, model, type InferSchemaType, type Model } from 'mongoose';

export const DOCUMENT_CATEGORIES = ['POLICY', 'CONTRACT', 'COMPLIANCE', 'OTHER'] as const;
export const DOCUMENT_STATUSES = ['DRAFT', 'FINAL', 'ARCHIVED'] as const;

/**
 * The longest body a legal document or contract may hold, in characters of HTML. Images are
 * uploaded and linked, not inlined, so this is a very long document — and a cap on what one
 * save can write.
 */
export const LEGAL_BODY_MAX_CHARS = 500_000;

/** A legal document record stored in the Documents repository. */
const documentSchema = new Schema(
  {
    title: { type: String, required: true, trim: true },
    category: { type: String, enum: DOCUMENT_CATEGORIES, required: true, default: 'OTHER' },
    owner: { type: String, trim: true, default: null },
    fileUrl: { type: String, trim: true, default: null },
    // The document itself, written in the portal's rich-text editor, as HTML.
    content: { type: String, default: '', maxlength: LEGAL_BODY_MAX_CHARS },
    status: { type: String, enum: DOCUMENT_STATUSES, required: true, default: 'DRAFT' },
  },
  { timestamps: true },
);

export type LegalDocumentDocument = InferSchemaType<typeof documentSchema>;
export const LegalDocumentModel: Model<LegalDocumentDocument> = model<LegalDocumentDocument>(
  'LegalDocument',
  documentSchema,
);
