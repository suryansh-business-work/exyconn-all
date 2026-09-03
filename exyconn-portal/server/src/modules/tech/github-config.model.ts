import { Schema, model, type InferSchemaType, type Model } from 'mongoose';

/**
 * The GitHub repository the portal can start workflows in, managed from the Tech
 * module's Environment Variables screen (DB-backed, no env dependency). Exactly
 * one document is `isActive` at a time and is used to dispatch tracker builds.
 */
const githubConfigSchema = new Schema(
  {
    label: { type: String, required: true, trim: true },
    owner: { type: String, required: true, trim: true },
    repo: { type: String, required: true, trim: true },
    /** Fine-grained token with Actions: read and write on the repository. */
    token: { type: String, required: true, trim: true },
    isActive: { type: Boolean, required: true, default: false },
  },
  { timestamps: true },
);

export type GithubConfigDocument = InferSchemaType<typeof githubConfigSchema>;

export const GithubConfigModel: Model<GithubConfigDocument> = model<GithubConfigDocument>(
  'GithubConfig',
  githubConfigSchema,
);
