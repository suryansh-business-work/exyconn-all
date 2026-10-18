import { Schema, model, type InferSchemaType, type Model } from 'mongoose';
import { badRequest } from '../../../utils/errors';
import { isSlug, SLUG_RULE } from './meeting.slug';

/** The booking page's address when a company has not chosen one: /book/meeting. */
export const DEFAULT_BOOKING_SLUG = 'meeting';

/**
 * How a company's meetings are booked, one row per company (CRM > Meetings > Settings): the
 * booking page's address, the Slack channel told of each booking, and the fixed video links
 * every confirmation carries.
 */
const meetingSettingsSchema = new Schema(
  {
    /** The page's part of /organization/<company>/book/<slug>. */
    bookingSlug: { type: String, required: true, trim: true, default: DEFAULT_BOOKING_SLUG },
    /** Slack channel id a booking is posted to; empty posts nowhere. */
    slackChannel: { type: String, default: '', trim: true },
    /** The same Google Meet room for every meeting; empty when not used. */
    googleMeetUrl: { type: String, default: '', trim: true },
    /** The same Zoom room for every meeting; empty when not used. */
    zoomUrl: { type: String, default: '', trim: true },
  },
  { timestamps: true },
);

export type MeetingSettingsDocument = InferSchemaType<typeof meetingSettingsSchema>;
export const MeetingSettingsModel: Model<MeetingSettingsDocument> = model<MeetingSettingsDocument>(
  'MeetingSettings',
  meetingSettingsSchema,
);

export interface MeetingSettingsInput {
  bookingSlug: string;
  slackChannel?: string | null;
  googleMeetUrl?: string | null;
  zoomUrl?: string | null;
}

export type MeetingSettings = Pick<
  MeetingSettingsDocument,
  'bookingSlug' | 'slackChannel' | 'googleMeetUrl' | 'zoomUrl'
>;

/** A video link on the provider's own https host, or empty. */
function videoLink(value: string | null | undefined, hosts: readonly string[], label: string) {
  const link = (value ?? '').trim();
  if (link === '') return '';
  let host = '';
  try {
    const url = new URL(link);
    host = url.protocol === 'https:' ? url.hostname : '';
  } catch {
    host = '';
  }
  if (!hosts.some((allowed) => host === allowed || host.endsWith(`.${allowed}`))) {
    badRequest(`Enter a ${label} link that starts with https://${hosts[0]}/.`);
  }
  return link;
}

/** The company's settings, created with the defaults the first time anything reads them. */
export async function meetingSettings(): Promise<MeetingSettings> {
  const doc = await MeetingSettingsModel.findOneAndUpdate(
    {},
    { $setOnInsert: { bookingSlug: DEFAULT_BOOKING_SLUG } },
    { upsert: true, new: true, setDefaultsOnInsert: true },
  ).lean();
  return {
    bookingSlug: doc.bookingSlug,
    slackChannel: doc.slackChannel ?? '',
    googleMeetUrl: doc.googleMeetUrl ?? '',
    zoomUrl: doc.zoomUrl ?? '',
  };
}

/** Saves the settings, refusing what the booking page or a confirmation could not use. */
export async function saveMeetingSettings(input: MeetingSettingsInput): Promise<MeetingSettings> {
  const bookingSlug = input.bookingSlug.trim().toLowerCase();
  if (!isSlug(bookingSlug)) {
    badRequest(`${SLUG_RULE} for the booking page address.`);
  }
  const values = {
    bookingSlug,
    slackChannel: (input.slackChannel ?? '').trim(),
    googleMeetUrl: videoLink(input.googleMeetUrl, ['meet.google.com'], 'Google Meet'),
    zoomUrl: videoLink(input.zoomUrl, ['zoom.us'], 'Zoom'),
  };
  await MeetingSettingsModel.findOneAndUpdate(
    {},
    { $set: values },
    { upsert: true, new: true, setDefaultsOnInsert: true, runValidators: true },
  );
  return values;
}
