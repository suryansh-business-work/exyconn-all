import { Schema, model, type InferSchemaType, type Model } from 'mongoose';

/**
 * The SonarQube (or SonarCloud) project the Tech › Security › SonarQube screen reads, managed
 * from Environment Variables like the platform's other credentials. Exactly one document is
 * `isActive` at a time, and that is the one the dashboard shows.
 */
const sonarConfigSchema = new Schema(
  {
    label: { type: String, required: true, trim: true },
    /** The server's base URL, e.g. https://sonarcloud.io or a self-hosted instance. */
    hostUrl: { type: String, required: true, trim: true },
    /** A user token with Browse on the project. Write-only: never returned by the API. */
    token: { type: String, required: true, trim: true },
    /** Same rule as @exyconn/regex SONAR_PROJECT_KEY (the API image does not ship that package). */
    projectKey: {
      type: String,
      required: true,
      trim: true,
      match: [/^(?!\d+$)[\w.:-]+$/, 'Enter the project key exactly as SonarQube shows it'],
    },
    /** SonarCloud's organization key; empty for a self-hosted SonarQube. */
    organization: { type: String, default: '', trim: true },
    isActive: { type: Boolean, required: true, default: false },
  },
  { timestamps: true },
);

export type SonarConfigDocument = InferSchemaType<typeof sonarConfigSchema>;

export const SonarConfigModel: Model<SonarConfigDocument> = model<SonarConfigDocument>(
  'SonarConfig',
  sonarConfigSchema,
);
