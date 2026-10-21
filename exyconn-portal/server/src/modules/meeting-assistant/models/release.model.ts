import { Schema, model, type InferSchemaType, type Model } from 'mongoose';
import { RELEASE_CHANNELS, RELEASE_STATUSES } from '../ma.enums';

const statusEventSchema = new Schema(
  {
    status: { type: String, enum: RELEASE_STATUSES, required: true },
    at: { type: Date, required: true },
    byName: { type: String, default: '' },
    note: { type: String, default: '' },
  },
  { _id: false },
);

/**
 * One build of the Chrome extension. Install-wide (a platform model): Exyconn ships one
 * extension, and each company picks which channel it receives in its settings.
 *
 * CI uploads the ZIP to the portal (GitHub Actions OIDC, see releases.upload.ts); it is stored in
 * GridFS (`fileId`, never handed to a browser) and streamed through a signed, expiring link.
 * `version` is unique and the stored checksum is fixed at upload, so a published version can
 * never be swapped for other bytes.
 */
const releaseSchema = new Schema(
  {
    version: { type: String, required: true, trim: true },
    channel: { type: String, enum: RELEASE_CHANNELS, required: true },
    buildNumber: { type: Number, required: true, min: 0 },
    commitSha: { type: String, required: true, trim: true },
    builtAt: { type: Date, required: true },
    artifactName: { type: String, required: true, trim: true },
    artifactSize: { type: Number, required: true, min: 1 },
    sha256: { type: String, required: true, lowercase: true, trim: true },
    /** The ZIP in the `ma_extension_releases` GridFS bucket (see releases.store.ts). Server-side only. */
    fileId: { type: Schema.Types.ObjectId, required: true },
    releaseUrl: { type: String, default: '' },
    buildRunUrl: { type: String, default: '' },
    releaseNotes: { type: String, default: '', maxlength: 20_000 },
    minChromeVersion: { type: String, default: '' },
    status: { type: String, enum: RELEASE_STATUSES, default: 'QA_PENDING' },
    storeItemId: { type: String, default: '' },
    storeUrl: { type: String, default: '' },
    publisherName: { type: String, default: '' },
    downloadCount: { type: Number, default: 0, min: 0 },
    statusHistory: { type: [statusEventSchema], default: [] },
  },
  { timestamps: true },
);

releaseSchema.index({ version: 1, channel: 1 }, { unique: true });
releaseSchema.index({ status: 1, builtAt: -1 });
// One row per build version: an upload of a version already stored is refused, even by a race.
releaseSchema.index({ version: 1 }, { unique: true });

export type MaReleaseDocument = InferSchemaType<typeof releaseSchema>;

export const MaReleaseModel: Model<MaReleaseDocument> = model<MaReleaseDocument>(
  'MaExtensionRelease',
  releaseSchema,
);
