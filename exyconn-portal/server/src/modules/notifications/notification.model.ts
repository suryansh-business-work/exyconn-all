import { Schema, model, type InferSchemaType, type Model } from 'mongoose';

export const NOTIFICATION_KINDS = [
  'ANNOUNCEMENT',
  'LEAVE',
  'PAYROLL',
  'GOAL',
  'PERFORMANCE',
  'REQUEST',
  'TRAINING',
  'ONBOARDING',
  // The company feed. Separate kinds rather than one SOCIAL, so somebody who wants the
  // comments but not the likes has something to filter on later.
  'SOCIAL_LIKE',
  'SOCIAL_COMMENT',
  'SOCIAL_SHARE',
  'GENERAL',
] as const;

const notificationSchema = new Schema(
  {
    employeeId: { type: String, required: true, index: true },
    kind: { type: String, enum: NOTIFICATION_KINDS, required: true, default: 'GENERAL' },
    title: { type: String, required: true, trim: true },
    body: { type: String, default: '' },
    /** In-portal path the notification points at, e.g. /me/announcements. */
    link: { type: String, default: null },
    read: { type: Boolean, required: true, default: false },
  },
  { timestamps: true },
);

// The centre only ever reads one employee's newest-first, unread-count included.
notificationSchema.index({ employeeId: 1, createdAt: -1 });

export type NotificationDocument = InferSchemaType<typeof notificationSchema>;
export const NotificationModel: Model<NotificationDocument> = model<NotificationDocument>(
  'Notification',
  notificationSchema,
);
