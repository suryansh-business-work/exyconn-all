import { Schema, model, type InferSchemaType, type Model } from 'mongoose';
import { SOCIAL_APPS, SOCIAL_NETWORKS } from './social.constants';

/** Where a post came from: read from the network, or written here. */
export const POST_ORIGINS = ['SYNCED', 'COMPOSED'] as const;
/** A written post's life: a synced one is always PUBLISHED. */
export const POST_STATUSES = ['DRAFT', 'SCHEDULED', 'PUBLISHING', 'PUBLISHED', 'FAILED'] as const;
export type PostStatus = (typeof POST_STATUSES)[number];

/** What the network counts for a post. Zero when the network does not share a number. */
const metricsSchema = new Schema(
  {
    likes: { type: Number, default: 0, min: 0 },
    comments: { type: Number, default: 0, min: 0 },
    shares: { type: Number, default: 0, min: 0 },
    views: { type: Number, default: 0, min: 0 },
  },
  { _id: false },
);

/**
 * One post on one connected account — read from the network by a sync, or written in the
 * composer and published (now or on schedule). One compose aimed at three accounts is three
 * posts sharing a `batchId`, because each succeeds, fails and performs on its own.
 */
const socialPostSchema = new Schema(
  {
    accountId: { type: String, required: true, index: true },
    network: { type: String, enum: SOCIAL_NETWORKS, required: true },
    app: { type: String, enum: SOCIAL_APPS, required: true },
    origin: { type: String, enum: POST_ORIGINS, required: true },
    status: { type: String, enum: POST_STATUSES, required: true, index: true },
    /** The network's own id once it exists there. */
    externalId: { type: String, default: null },
    text: { type: String, default: '', trim: true },
    mediaUrl: { type: String, default: '', trim: true },
    link: { type: String, default: '', trim: true },
    permalink: { type: String, default: '' },
    scheduledAt: { type: Date, default: null, index: true },
    publishedAt: { type: Date, default: null, index: true },
    /** The network's reason when publishing failed. */
    error: { type: String, default: '' },
    metrics: { type: metricsSchema, default: () => ({}) },
    batchId: { type: String, default: '' },
    createdBy: { type: String, default: '' },
  },
  { timestamps: true },
);
socialPostSchema.index(
  { accountId: 1, externalId: 1 },
  { unique: true, partialFilterExpression: { externalId: { $type: 'string' } } },
);

export type SocialMediaPostDocument = InferSchemaType<typeof socialPostSchema>;
export const SocialMediaPostModel: Model<SocialMediaPostDocument> = model<SocialMediaPostDocument>(
  'SocialMediaPost',
  socialPostSchema,
);
