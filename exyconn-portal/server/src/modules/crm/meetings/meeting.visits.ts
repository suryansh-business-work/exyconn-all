import { Schema, model, type InferSchemaType, type Model } from 'mongoose';
import { getTimezone } from 'countries-and-timezones';
import { countryName } from '../../../utils/iso';
import { isValidTimezone } from '../../../utils/timezone';

/**
 * One visit to a booking page, or one booking made from it, for CRM > Meetings > Tracking.
 *
 * GDPR by design: nothing that identifies a person is kept — no IP address, no cookie, no
 * name. The country is read from the time zone the visitor's own browser reports, and every
 * row is deleted by the database after RETENTION_DAYS.
 */
export const VISIT_KINDS = ['VIEW', 'BOOKED'] as const;
export type VisitKind = (typeof VISIT_KINDS)[number];

const RETENTION_DAYS = 395;

const meetingVisitSchema = new Schema({
  kind: { type: String, enum: VISIT_KINDS, required: true },
  /** The meeting type's link part; empty for the company's booking page itself. */
  meetingSlug: { type: String, default: '', trim: true },
  /** ISO 3166-1 alpha-2, from the visitor's time zone; empty when it names no country. */
  country: { type: String, default: '' },
  createdAt: { type: Date, default: Date.now, expires: RETENTION_DAYS * 24 * 60 * 60 },
});
meetingVisitSchema.index({ createdAt: -1, kind: 1 });

export type MeetingVisitDocument = InferSchemaType<typeof meetingVisitSchema>;
export const MeetingVisitModel: Model<MeetingVisitDocument> = model<MeetingVisitDocument>(
  'MeetingVisit',
  meetingVisitSchema,
);

/** The country a time zone belongs to (Asia/Kolkata -> IN); empty for UTC and the like. */
export function countryOfZone(zone: string | null | undefined): string {
  if (!zone || !isValidTimezone(zone)) return '';
  return getTimezone(zone)?.countries[0] ?? '';
}

/** Records one visit or booking; callers log a failure, as tracking must never break a page. */
export async function recordVisit(kind: VisitKind, meetingSlug: string, zone?: string | null) {
  await MeetingVisitModel.create({ kind, meetingSlug, country: countryOfZone(zone) });
}

interface Count {
  key: string;
  views: number;
  bookings: number;
}

const MAX_DAYS = 365;
const DAY_MS = 24 * 60 * 60 * 1000;

/** Views and bookings grouped by one field of the visit, most viewed first. */
const grouped = (since: Date, key: string, limit: number) =>
  MeetingVisitModel.aggregate<Count>([
    { $match: { createdAt: { $gte: since } } },
    {
      $group: {
        _id: key,
        views: { $sum: { $cond: [{ $eq: ['$kind', 'VIEW'] }, 1, 0] } },
        bookings: { $sum: { $cond: [{ $eq: ['$kind', 'BOOKED'] }, 1, 0] } },
      },
    },
    { $sort: { views: -1, bookings: -1 } },
    { $limit: limit },
    { $project: { _id: 0, key: '$_id', views: 1, bookings: 1 } },
  ]);

/** Booking page tracking over the last `days`: totals, by country, by meeting, by day. */
export async function meetingTracking(days: number) {
  const span = Math.min(Math.max(Math.trunc(days), 1), MAX_DAYS);
  const since = new Date(Date.now() - span * DAY_MS);
  const [byCountry, byMeeting, byDay, recent] = await Promise.all([
    grouped(since, '$country', 50),
    grouped(since, '$meetingSlug', 50),
    grouped(
      since,
      { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } } as never,
      MAX_DAYS,
    ),
    MeetingVisitModel.find({ createdAt: { $gte: since } })
      .sort({ createdAt: -1 })
      .limit(50)
      .lean(),
  ]);
  const views = byMeeting.reduce((sum, row) => sum + row.views, 0);
  const bookings = byMeeting.reduce((sum, row) => sum + row.bookings, 0);
  return {
    days: span,
    views,
    bookings,
    byCountry: byCountry.map((row) => ({
      ...row,
      country: row.key,
      countryName: row.key ? countryName(row.key) : '',
    })),
    byMeeting: byMeeting.map((row) => ({ ...row, meetingSlug: row.key })),
    byDay: byDay
      .map((row) => ({ ...row, day: row.key }))
      .sort((a, b) => a.day.localeCompare(b.day)),
    recent: recent.map((row) => ({
      id: String(row._id),
      kind: row.kind,
      meetingSlug: row.meetingSlug,
      country: row.country,
      countryName: row.country ? countryName(row.country) : '',
      at: row.createdAt,
    })),
  };
}
