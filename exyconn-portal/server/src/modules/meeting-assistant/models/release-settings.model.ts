import { Schema, model, type InferSchemaType, type Model } from 'mongoose';

/** The repository whose CI may upload extension builds until a release manager changes it. */
export const DEFAULT_RELEASE_REPOSITORY = 'suryansh-business-work/exyconn-all';

/**
 * How extension builds reach the portal and who hears about them: one install-wide row (a
 * platform model), edited by release managers on AI › Meeting Assistant › Releases.
 */
const releaseSettingsSchema = new Schema(
  {
    key: { type: String, required: true, default: 'global' },
    /** `owner/repo` whose GitHub Actions OIDC token may upload builds (from main only). */
    allowedRepository: { type: String, default: DEFAULT_RELEASE_REPOSITORY, trim: true },
    /** The Slack channel a published build is announced in; '' posts nowhere. */
    slackChannelId: { type: String, default: '', trim: true },
    slackChannelName: { type: String, default: '', trim: true },
    /** Also post when a new build arrives for QA. Off by default. */
    notifyOnNewBuild: { type: Boolean, default: false },
    updatedByName: { type: String, default: '' },
  },
  { timestamps: true },
);

releaseSettingsSchema.index({ key: 1 }, { unique: true });

export type MaReleaseSettingsDocument = InferSchemaType<typeof releaseSettingsSchema>;

export const MaReleaseSettingsModel: Model<MaReleaseSettingsDocument> =
  model<MaReleaseSettingsDocument>('MaReleaseSettings', releaseSettingsSchema);
