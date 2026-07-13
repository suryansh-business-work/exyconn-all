import { Schema, model, type InferSchemaType, type Model } from 'mongoose';

/** How binding a company holiday is. */
export const HOLIDAY_TYPES = ['PUBLIC', 'OPTIONAL', 'RESTRICTED'] as const;

/** A company-wide holiday, readable by every authenticated employee. */
const holidaySchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    date: { type: Date, required: true },
    type: { type: String, enum: HOLIDAY_TYPES, required: true, default: 'PUBLIC' },
    description: { type: String, trim: true, default: null },
  },
  { timestamps: true },
);

holidaySchema.index({ date: 1 });

export type HolidayDocument = InferSchemaType<typeof holidaySchema>;

export const HolidayModel: Model<HolidayDocument> = model<HolidayDocument>('Holiday', holidaySchema);
