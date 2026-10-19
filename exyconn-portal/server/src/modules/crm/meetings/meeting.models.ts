import { Schema, model, type InferSchemaType, type Model } from 'mongoose';

/** One weekday's bookable hours, in the meeting type's own time zone ("09:00"-"17:30"). */
const weeklyHoursSchema = new Schema(
  {
    day: { type: Number, required: true, min: 0, max: 6 },
    enabled: { type: Boolean, default: false },
    start: { type: String, default: '09:00' },
    end: { type: String, default: '17:00' },
  },
  { _id: false },
);

/**
 * A kind of meeting people can book from a public link (crm.exyconn.com/organization/<company>/
 * book/<page>/<slug>), like
 * a Calendly event type: how long it is, where it happens, and when the host is free.
 */
const meetingTypeSchema = new Schema(
  {
    title: { type: String, required: true, trim: true },
    /** The link's own part; unique across every company, as the link has no company in it. */
    slug: { type: String, required: true, trim: true, lowercase: true },
    description: { type: String, default: '' },
    durationMinutes: { type: Number, required: true, min: 5, max: 480 },
    /** Where it happens: a video-call link, a phone number or an address. Shown once booked. */
    location: { type: String, default: '', trim: true },
    hostUserId: { type: String, required: true },
    hostName: { type: String, required: true, trim: true },
    hostEmail: { type: String, required: true, trim: true, lowercase: true },
    /** IANA zone the weekly hours are in, e.g. Asia/Kolkata. */
    timezone: { type: String, required: true, trim: true },
    weeklyHours: { type: [weeklyHoursSchema], default: [] },
    /** Free time kept before and after every meeting. */
    bufferMinutes: { type: Number, default: 0, min: 0, max: 240 },
    /** How soon from now a meeting can start. */
    minNoticeHours: { type: Number, default: 4, min: 0, max: 720 },
    /** How far ahead a meeting can be booked. */
    maxDaysAhead: { type: Number, default: 30, min: 1, max: 365 },
    active: { type: Boolean, default: true },
  },
  { timestamps: true },
);
meetingTypeSchema.index({ slug: 1 }, { unique: true });

export const BOOKING_STATUSES = ['CONFIRMED', 'CANCELLED'] as const;

/** One meeting somebody booked from a public link. */
const meetingBookingSchema = new Schema(
  {
    meetingTypeId: { type: String, required: true, index: true },
    meetingTitle: { type: String, required: true, trim: true },
    hostUserId: { type: String, required: true, index: true },
    hostName: { type: String, required: true, trim: true },
    startAt: { type: Date, required: true, index: true },
    endAt: { type: Date, required: true },
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true, lowercase: true, index: true },
    notes: { type: String, default: '' },
    /** Others the booker invited; each got the confirmation. */
    guests: { type: [String], default: [] },
    /** The zone the person booked in, for their confirmation email. */
    timezone: { type: String, default: 'UTC' },
    /** ISO country of that zone, for tracking; never from the booker's IP address. */
    country: { type: String, default: '' },
    status: { type: String, enum: BOOKING_STATUSES, required: true, default: 'CONFIRMED' },
    /** The CRM contact the booking was filed under (found by email, or created). */
    contactId: { type: String, default: '' },
  },
  { timestamps: true },
);
// Two people can never hold the same start of the same meeting type.
meetingBookingSchema.index(
  { meetingTypeId: 1, startAt: 1 },
  { unique: true, partialFilterExpression: { status: 'CONFIRMED' } },
);

export type MeetingTypeDocument = InferSchemaType<typeof meetingTypeSchema>;
export type MeetingBookingDocument = InferSchemaType<typeof meetingBookingSchema>;

export const MeetingTypeModel: Model<MeetingTypeDocument> = model<MeetingTypeDocument>(
  'MeetingType',
  meetingTypeSchema,
);
export const MeetingBookingModel: Model<MeetingBookingDocument> = model<MeetingBookingDocument>(
  'MeetingBooking',
  meetingBookingSchema,
);
