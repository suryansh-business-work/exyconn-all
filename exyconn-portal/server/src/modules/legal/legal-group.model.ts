import { Schema, model, type InferSchemaType, type Model } from 'mongoose';

/** The three registers Legal keeps, each of which can be grouped and assigned to people. */
export const LEGAL_ITEM_KINDS = ['CONTRACT', 'POLICY', 'DOCUMENT'] as const;
export type LegalItemKind = (typeof LEGAL_ITEM_KINDS)[number];

/**
 * A named set of contracts, policies or documents — "Part Time Employee Contracts", "IT
 * policies". A group holds one kind only, so its members can be handed out together and
 * read as a set. Members point at their group (`groupId`); deleting a group ungroups them.
 */
const legalGroupSchema = new Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 120 },
    kind: { type: String, enum: LEGAL_ITEM_KINDS, required: true },
    description: { type: String, default: '', trim: true, maxlength: 1000 },
  },
  { timestamps: true },
);

legalGroupSchema.index({ kind: 1, name: 1 });

export type LegalGroupDocument = InferSchemaType<typeof legalGroupSchema>;
export const LegalGroupModel: Model<LegalGroupDocument> = model<LegalGroupDocument>(
  'LegalGroup',
  legalGroupSchema,
);
