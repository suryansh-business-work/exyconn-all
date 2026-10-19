import { describe, expect, it } from 'vitest';
import {
  meetingSettingsSchema,
  toMeetingSettingsValues,
} from '../../../../../../src/pages/meetings/forms/meeting-settings';
import { settingsRow } from '../../meetings-fixtures';

const valid = { bookingSlug: 'team', slackChannel: '', googleMeetUrl: '', zoomUrl: '' };

/** The first error message for `field` when the rest of the settings are valid. */
function errorFor(field: keyof typeof valid, value: string) {
  const result = meetingSettingsSchema.safeParse({ ...valid, [field]: value });
  return result.success ? undefined : result.error.issues[0].message;
}

describe('meetingSettingsSchema', () => {
  it('accepts an address with no video rooms and trims what it keeps', () => {
    expect(meetingSettingsSchema.parse({ ...valid, bookingSlug: '  sales-team ' })).toEqual({
      ...valid,
      bookingSlug: 'sales-team',
    });
  });

  it('wants an address of 3 to 60 link-safe characters', () => {
    expect(errorFor('bookingSlug', 'ab')).toBe('Use at least 3 characters');
    expect(errorFor('bookingSlug', 'abc')).toBeUndefined();
    expect(errorFor('bookingSlug', 'a'.repeat(60))).toBeUndefined();
    expect(errorFor('bookingSlug', 'a'.repeat(61))).toBe('Keep the address under 60 characters');
    expect(errorFor('bookingSlug', 'Sales Team')).toBe('Use lower-case letters, digits and dashes');
  });

  it('takes a Google Meet room on meet.google.com over https only', () => {
    expect(errorFor('googleMeetUrl', 'https://meet.google.com/abc-defg-hij')).toBeUndefined();
    const message = 'Enter the full Google Meet link, e.g. https://meet.google.com/…';
    expect(errorFor('googleMeetUrl', 'http://meet.google.com/abc')).toBe(message);
    expect(errorFor('googleMeetUrl', 'meet.google.com/abc')).toBe(message);
    expect(errorFor('googleMeetUrl', 'https://zoom.us/j/1')).toBe(message);
  });

  it('takes a Zoom room on zoom.us or one of its subdomains, not a look-alike host', () => {
    expect(errorFor('zoomUrl', 'https://zoom.us/j/123')).toBeUndefined();
    expect(errorFor('zoomUrl', 'https://us02web.zoom.us/j/123')).toBeUndefined();
    expect(errorFor('zoomUrl', 'https://notzoom.us/j/123')).toBe(
      'Enter the full Zoom link, e.g. https://zoom.us/…',
    );
  });

  it('treats a room of only spaces as none', () => {
    expect(meetingSettingsSchema.parse({ ...valid, zoomUrl: '   ' }).zoomUrl).toBe('');
  });
});

describe('toMeetingSettingsValues', () => {
  it('copies the saved settings into the form, leaving out the type name', () => {
    const row = settingsRow({ slackChannel: 'C1', zoomUrl: 'https://zoom.us/j/1' });

    expect(toMeetingSettingsValues({ ...row, __typename: 'MeetingSettings' })).toEqual({
      bookingSlug: 'team',
      slackChannel: 'C1',
      googleMeetUrl: '',
      zoomUrl: 'https://zoom.us/j/1',
    });
  });
});
