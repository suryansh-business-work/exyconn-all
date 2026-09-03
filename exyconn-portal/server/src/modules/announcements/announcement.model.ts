import { Schema, model, type InferSchemaType, type Model } from 'mongoose';

export const ANNOUNCEMENT_CATEGORIES = ['NOTICE', 'POLICY', 'EVENT', 'UPDATE'] as const;
export const ANNOUNCEMENT_AUDIENCES = ['ALL', 'DEPARTMENT', 'EMPLOYEES'] as const;

const announcementSchema = new Schema(
  {
    title: { type: String, required: true, trim: true },
    body: { type: String, required: true, trim: true },
    category: { type: String, enum: ANNOUNCEMENT_CATEGORIES, required: true, default: 'NOTICE' },
    /** Pinned announcements sort above the rest regardless of date. */
    pinned: { type: Boolean, required: true, default: false },
    publishedAt: { type: Date, required: true, default: Date.now },
    /** Null means it never stops showing. */
    expiresAt: { type: Date, default: null },
    /** Who sees it. DEPARTMENT needs `department`, EMPLOYEES needs `employeeIds`. */
    audience: { type: String, enum: ANNOUNCEMENT_AUDIENCES, required: true, default: 'ALL' },
    department: { type: String, default: null },
    employeeIds: { type: [String], default: [] },
  },
  { timestamps: true },
);

// The employee feed always filters on "published and not expired", newest first.
announcementSchema.index({ publishedAt: -1 });

export type AnnouncementDocument = InferSchemaType<typeof announcementSchema>;
export const AnnouncementModel: Model<AnnouncementDocument> = model<AnnouncementDocument>(
  'Announcement',
  announcementSchema,
);
