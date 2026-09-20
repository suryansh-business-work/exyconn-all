import { Schema, model, type InferSchemaType, type Model } from 'mongoose';

/**
 * One request for a counterparty's signature on a contract, and the evidence of it.
 *
 * Signing used to be a member of the legal team typing a name into a field. That records an
 * assertion, not a signature: nothing tied it to the person named, to the moment, or to the
 * document as it stood. This row is the evidence — who was asked, from where they answered,
 * what they typed, and the hash of the file they were shown.
 *
 * Only the SHA-256 of the link's token is stored, on the same reasoning as a project share:
 * the link is a bearer credential, so a database dump must not carry live ones.
 */
const contractSignatureSchema = new Schema(
  {
    contractId: { type: String, required: true, index: true },
    tokenHash: { type: String, required: true, unique: true },
    /** Who was asked, as Legal addressed them. */
    signerName: { type: String, required: true, trim: true },
    signerEmail: { type: String, required: true, lowercase: true, trim: true },
    requestedByName: { type: String, default: '', trim: true },
    /** A request nobody acts on has to stop working. */
    expiresAt: { type: Date, required: true },
    /** Set when Legal withdraws the request. Withdrawn rows are kept, never deleted. */
    revokedAt: { type: Date, default: null },

    // Everything below is written once, at the moment of signing, and never again.
    signedAt: { type: Date, default: null },
    /** What the signer typed as their name — their mark, in their own words. */
    signedName: { type: String, default: '', trim: true },
    /** Where they answered from, and what with. Part of the evidence, not analytics. */
    signedIp: { type: String, default: '', trim: true },
    signedUserAgent: { type: String, default: '', trim: true },
    /**
     * SHA-256 of the document's bytes, read at the moment of signing.
     *
     * This is what makes the signature about a document rather than about a title: if the
     * file behind the URL is ever replaced, its hash no longer matches what was signed, and
     * the record says so instead of quietly appearing to cover the new version.
     */
    documentSha256: { type: String, default: '', trim: true },
    /** The URL as it was at signing, so the hash has something to be a hash OF. */
    documentUrl: { type: String, default: '', trim: true },
  },
  { timestamps: true },
);

// Legal reads one contract's requests, newest first.
contractSignatureSchema.index({ contractId: 1, createdAt: -1 });

export type ContractSignatureDocument = InferSchemaType<typeof contractSignatureSchema>;
export const ContractSignatureModel: Model<ContractSignatureDocument> =
  model<ContractSignatureDocument>('ContractSignature', contractSignatureSchema);
