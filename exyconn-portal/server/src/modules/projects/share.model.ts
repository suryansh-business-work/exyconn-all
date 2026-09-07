import { Schema, model, type InferSchemaType, type Model } from 'mongoose';

/**
 * One read-only link handed to a client so they can follow a project without an account.
 *
 * Only the SHA-256 hash of the token is stored. The token itself is returned once, at
 * creation, and is never recoverable afterwards: a share link is a bearer credential, and a
 * database dump that contained the live tokens would be a database dump that unlocked every
 * shared project.
 */
const projectShareSchema = new Schema(
  {
    projectId: { type: Schema.Types.ObjectId, ref: 'Project', required: true, index: true },
    tokenHash: { type: String, required: true, unique: true },
    /** What the link is for — "Acme weekly update" — so the list is readable. */
    label: { type: String, default: '', trim: true },
    expiresAt: { type: Date, required: true },
    createdByName: { type: String, default: '', trim: true },
    /** Set when somebody revokes the link. A revoked share is kept, never deleted. */
    revokedAt: { type: Date, default: null },
  },
  { timestamps: true },
);

export type ProjectShareDocument = InferSchemaType<typeof projectShareSchema>;

export const ProjectShareModel: Model<ProjectShareDocument> = model<ProjectShareDocument>(
  'ProjectShare',
  projectShareSchema,
);
