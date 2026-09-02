import { Schema, model, type InferSchemaType, type Model } from 'mongoose';

export const BENEFIT_KINDS = ['INSURANCE', 'PF', 'GRATUITY', 'WELLNESS', 'OTHER'] as const;

const benefitSchema = new Schema(
  {
    employeeId: { type: String, required: true, index: true },
    kind: { type: String, enum: BENEFIT_KINDS, required: true, default: 'OTHER' },
    name: { type: String, required: true, trim: true },
    provider: { type: String, default: '' },
    /** Policy or account reference. Shown to the employee as-is. */
    reference: { type: String, default: '' },
    coverage: { type: String, default: '' },
    validFrom: { type: Date, default: null },
    validTo: { type: Date, default: null },
    documentUrl: { type: String, default: null },
  },
  { timestamps: true },
);

benefitSchema.index({ employeeId: 1, kind: 1 });

export type BenefitDocument = InferSchemaType<typeof benefitSchema>;
export const BenefitModel: Model<BenefitDocument> = model<BenefitDocument>(
  'Benefit',
  benefitSchema,
);
