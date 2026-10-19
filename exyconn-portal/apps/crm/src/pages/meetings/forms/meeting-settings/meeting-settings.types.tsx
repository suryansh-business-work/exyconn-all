import { z } from 'zod';
import { HTTP_URL, SLUG } from '@exyconn/regex';
import type { MeetingSettingsFieldsFragment } from '@exyconn/shell/graphql/generated';

export type MeetingSettingsRow = MeetingSettingsFieldsFragment;

/** Whether a link is an https address on the provider's own host. */
function isRoomLink(value: string, host: string): boolean {
  if (!HTTP_URL.test(value) || !value.startsWith('https://')) {
    return false;
  }
  const { hostname } = new URL(value);
  return hostname === host || hostname.endsWith(`.${host}`);
}

/** A fixed room link for one provider: blank, or an https address on its host. */
const roomLink = (host: string, label: string) =>
  z
    .string()
    .trim()
    .refine(
      (value) => value === '' || isRoomLink(value, host),
      `Enter the full ${label} link, e.g. https://${host}/…`,
    );

export const meetingSettingsSchema = z.object({
  bookingSlug: z
    .string()
    .trim()
    .min(3, 'Use at least 3 characters')
    .max(60, 'Keep the address under 60 characters')
    .regex(SLUG, 'Use lower-case letters, digits and dashes'),
  slackChannel: z.string(),
  googleMeetUrl: roomLink('meet.google.com', 'Google Meet'),
  zoomUrl: roomLink('zoom.us', 'Zoom'),
});

export type MeetingSettingsValues = z.infer<typeof meetingSettingsSchema>;

export const toMeetingSettingsValues = (row: MeetingSettingsRow): MeetingSettingsValues => ({
  bookingSlug: row.bookingSlug,
  slackChannel: row.slackChannel,
  googleMeetUrl: row.googleMeetUrl,
  zoomUrl: row.zoomUrl,
});
