import { Schema, model, type InferSchemaType, type Model } from 'mongoose';

export const CONTRACT_TYPES = ['NDA', 'MSA', 'SOW', 'EMPLOYMENT'] as const;
export const CONTRACT_STATUSES = ['DRAFT', 'ACTIVE', 'EXPIRED', 'TERMINATED'] as const;

const contractSchema = new Schema(
  {
    title: { type: String, required: true, trim: true },
    party: { type: String, required: true, trim: true },
    type: { type: String, enum: CONTRACT_TYPES, required: true, default: 'NDA' },
    effectiveDate: { type: Date, required: true },
    expiryDate: { type: Date, required: true },
    status: { type: String, enum: CONTRACT_STATUSES, required: true, default: 'DRAFT' },
    // Set when the contract is emailed to a counterparty from the Contracts page.
    sentAt: { type: Date, default: null },
    /**
     * The document itself — what a counterparty is actually asked to sign.
     *
     * Contracts carried a title, two dates and a party, and nothing to read. A signature
     * request needs something to show, and a signature has to be OF something, so the file
     * lives here and its hash is recorded when somebody signs it.
     */
    documentUrl: { type: String, default: '', trim: true },
    // Set when a contract is signed from the Sign Board.
    signedBy: { type: String, trim: true, default: null },
    signedAt: { type: Date, default: null },
  },
  { timestamps: true },
);

export type ContractDocument = InferSchemaType<typeof contractSchema>;
export const ContractModel: Model<ContractDocument> = model<ContractDocument>(
  'Contract',
  contractSchema,
);
