import { Schema, model, type InferSchemaType, type Model } from 'mongoose';
import { APP_LOG_LEVELS, APP_LOG_SOURCES, APP_LOG_STATUSES } from './logs.constants';

/**
 * One row per DISTINCT problem: every occurrence with the same fingerprint (source, app,
 * level, error name and normalised message) lands here and bumps `count`. This is the row
 * the Tech > Logs grid lists; the individual occurrences live in `AppLogEvent`.
 *
 * The "latest" fields (stack, route, platform, appVersion, last user) are overwritten by
 * every occurrence, so the row always describes the most recent one.
 *
 * Written only by the pipeline upsert in logs.ingest.ts, which maintains `firstSeenAt` and
 * `lastSeenAt` itself — so no mongoose timestamps.
 */
const appLogGroupSchema = new Schema({
  fingerprint: { type: String, required: true, unique: true },
  source: { type: String, enum: APP_LOG_SOURCES, required: true },
  app: { type: String, required: true },
  level: { type: String, enum: APP_LOG_LEVELS, required: true },
  errorName: { type: String, default: '' },
  message: { type: String, required: true },
  stack: { type: String, default: '' },
  route: { type: String, default: '' },
  status: { type: String, enum: APP_LOG_STATUSES, default: 'OPEN' },
  count: { type: Number, default: 0 },
  userIds: { type: [String], default: [] },
  userCount: { type: Number, default: 0 },
  lastUserName: { type: String, default: '' },
  lastUserEmail: { type: String, default: '' },
  platform: { type: String, default: '' },
  appVersion: { type: String, default: '' },
  firstSeenAt: { type: Date, required: true },
  lastSeenAt: { type: Date, required: true },
  resolvedAt: { type: Date, default: null },
});

appLogGroupSchema.index({ lastSeenAt: -1 });
appLogGroupSchema.index({ status: 1, level: 1, lastSeenAt: -1 });

export type AppLogGroupDocument = InferSchemaType<typeof appLogGroupSchema>;

export const AppLogGroupModel: Model<AppLogGroupDocument> = model<AppLogGroupDocument>(
  'AppLogGroup',
  appLogGroupSchema,
);
