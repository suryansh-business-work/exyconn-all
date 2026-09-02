import { Schema, model, type InferSchemaType, type Model } from 'mongoose';

export const DOCUMENT_KINDS = [
  'OFFER_LETTER',
  'APPOINTMENT_LETTER',
  'SALARY_SLIP',
  'TAX',
  'EXPERIENCE',
  'RELIEVING',
  'POLICY',
  'OTHER',
] as const;

const documentSchema = new Schema(
  {
    employeeId: { type: String, required: true, index: true },
    kind: { type: String, enum: DOCUMENT_KINDS, required: true, default: 'OTHER' },
    title: { type: String, required: true, trim: true },
    url: { type: String, required: true, trim: true },
    issuedOn: { type: Date, required: true, default: Date.now },
  },
  { timestamps: true },
);

documentSchema.index({ employeeId: 1, issuedOn: -1 });

export type EmployeeDocumentDocument = InferSchemaType<typeof documentSchema>;
export const EmployeeDocumentModel: Model<EmployeeDocumentDocument> =
  model<EmployeeDocumentDocument>('EmployeeDocument', documentSchema);
