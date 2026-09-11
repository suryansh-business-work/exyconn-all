import { Schema, model, type InferSchemaType, type Model } from 'mongoose';
import { APP_LOG_EVENT_TTL_SECONDS, APP_LOG_LEVELS } from './logs.constants';

const breadcrumbSchema = new Schema(
  {
    at: { type: Date, required: true },
    level: { type: String, enum: APP_LOG_LEVELS, required: true },
    message: { type: String, required: true },
  },
  { _id: false },
);

/**
 * One occurrence of an `AppLogGroup`: who hit it, on what device and build, on which screen,
 * and what the app was doing just before (`breadcrumbs`). `count` is how many identical
 * entries the client folded into this one before sending (a render loop sends one row, not
 * a thousand). Expires after `APP_LOG_EVENT_TTL_SECONDS`.
 */
const appLogEventSchema = new Schema(
  {
    groupId: { type: Schema.Types.ObjectId, ref: 'AppLogGroup', required: true },
    level: { type: String, enum: APP_LOG_LEVELS, required: true },
    message: { type: String, required: true },
    stack: { type: String, default: '' },
    componentStack: { type: String, default: '' },
    route: { type: String, default: '' },
    /** JSON text of whatever the call site attached. */
    context: { type: String, default: '' },
    breadcrumbs: { type: [breadcrumbSchema], default: [] },
    count: { type: Number, default: 1 },
    /** When the client saw it — may be long before `createdAt` if the app crashed first. */
    occurredAt: { type: Date, required: true },
    userId: { type: String, default: '' },
    userName: { type: String, default: '' },
    userEmail: { type: String, default: '' },
    /** True when the user came from the request's token, false when the client only claimed it. */
    userVerified: { type: Boolean, default: false },
    deviceId: { type: String, default: '' },
    platform: { type: String, default: '' },
    osVersion: { type: String, default: '' },
    deviceModel: { type: String, default: '' },
    appVersion: { type: String, default: '' },
    sessionId: { type: String, default: '' },
    userAgent: { type: String, default: '' },
    ip: { type: String, default: '' },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

appLogEventSchema.index({ groupId: 1, occurredAt: -1 });
appLogEventSchema.index({ createdAt: 1 }, { expireAfterSeconds: APP_LOG_EVENT_TTL_SECONDS });

export type AppLogEventDocument = InferSchemaType<typeof appLogEventSchema>;

export const AppLogEventModel: Model<AppLogEventDocument> = model<AppLogEventDocument>(
  'AppLogEvent',
  appLogEventSchema,
);
