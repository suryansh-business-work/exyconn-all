import { describe, expect, it } from 'vitest';
import {
  toInitial,
  trackerSettingsSchema,
} from '../../../../../../src/pages/tracker/forms/tracker-settings/tracker-settings.schema';
import {
  WEBCAM_CORNERS,
  WEBCAM_CORNER_OPTIONS,
} from '../../../../../../src/pages/tracker/forms/tracker-settings/webcam.options';
import { settingsRow } from '../../tracker.fixtures';

const valid = () => toInitial(settingsRow());

/** The messages Zod raised for one field, or [] when it passed. */
function errorsFor(input: Record<string, unknown>, field: string): string[] {
  const result = trackerSettingsSchema.safeParse(input);
  if (result.success) {
    return [];
  }
  return result.error.issues
    .filter((issue) => issue.path[0] === field)
    .map((issue) => issue.message);
}

describe('webcam corner options', () => {
  it('offers the four corners the desktop app places a photo by', () => {
    expect(WEBCAM_CORNERS).toEqual(['bottom-right', 'bottom-left', 'top-right', 'top-left']);
    expect(WEBCAM_CORNER_OPTIONS.map((option) => option.label)).toEqual([
      'Bottom right',
      'Bottom left',
      'Top right',
      'Top left',
    ]);
  });
});

describe('toInitial', () => {
  it('copies every editable field off the saved row and drops its id', () => {
    const row = settingsRow({ webcamEnabled: true, webcamCorner: 'top-left' });
    const initial = toInitial(row);
    expect(initial).not.toHaveProperty('id');
    const { id, ...editable } = row;
    expect(id).toBe('settings-1');
    expect(initial).toEqual(editable);
  });
});

describe('trackerSettingsSchema', () => {
  it('accepts the saved settings as they are', () => {
    expect(trackerSettingsSchema.safeParse(valid()).success).toBe(true);
  });

  it('reads numbers typed into the fields as numbers', () => {
    const parsed = trackerSettingsSchema.parse({ ...valid(), intervalMinutes: '15' });
    expect(parsed.intervalMinutes).toBe(15);
  });

  it('refuses text where a number belongs', () => {
    expect(errorsFor({ ...valid(), intervalMinutes: 'ten' }, 'intervalMinutes')).toEqual([
      'Enter a number',
    ]);
  });

  it.each([
    ['intervalMinutes', 0, 60, 61],
    ['screenshotsPerInterval', -1, 10, 11],
    ['idleThresholdSeconds', 9, 3600, 3601],
    ['idleAutoPauseMinutes', -1, 240, 241],
    ['screenshotMaxWidth', 319, 3840, 3841],
    ['screenshotQuality', -1, 100, 101],
    ['screenshotRetentionDays', -1, 3650, 3651],
    ['syncIntervalMinutes', 0, 60, 61],
    ['autoStartHour', -1, 23, 24],
    ['autoStopHour', -1, 23, 24],
    ['digestHour', -1, 23, 24],
  ])('holds %s between its bounds', (field, below, top, above) => {
    expect(errorsFor({ ...valid(), [field]: below }, field)).toHaveLength(1);
    expect(errorsFor({ ...valid(), [field]: top }, field)).toEqual([]);
    expect(errorsFor({ ...valid(), [field]: above }, field)).toHaveLength(1);
  });

  it('keeps 0 as a real value where it means "off" or "forever"', () => {
    const parsed = trackerSettingsSchema.parse({
      ...valid(),
      idleAutoPauseMinutes: 0,
      screenshotRetentionDays: 0,
      screenshotsPerInterval: 0,
    });
    expect(parsed.idleAutoPauseMinutes).toBe(0);
    expect(parsed.screenshotRetentionDays).toBe(0);
  });

  it('wants whole numbers, not fractions', () => {
    expect(errorsFor({ ...valid(), intervalMinutes: 2.5 }, 'intervalMinutes')).toHaveLength(1);
  });

  it('only accepts a corner the desktop app knows', () => {
    expect(errorsFor({ ...valid(), webcamCorner: 'centre' }, 'webcamCorner')).toHaveLength(1);
    expect(errorsFor({ ...valid(), webcamCorner: 'top-left' }, 'webcamCorner')).toEqual([]);
  });

  it('requires a consent disclosure', () => {
    expect(errorsFor({ ...valid(), consentText: '' }, 'consentText')).toEqual([
      'Consent text is required',
    ]);
  });

  it('accepts an IANA zone or the empty "each device" choice, and nothing else', () => {
    expect(errorsFor({ ...valid(), defaultTimezone: '' }, 'defaultTimezone')).toEqual([]);
    expect(errorsFor({ ...valid(), defaultTimezone: 'Europe/London' }, 'defaultTimezone')).toEqual(
      [],
    );
    expect(errorsFor({ ...valid(), defaultTimezone: 'Mars/Base' }, 'defaultTimezone')).toEqual([
      'Choose a valid IANA timezone',
    ]);
  });

  it('wants a real true/false for every switch', () => {
    expect(errorsFor({ ...valid(), blurScreenshots: 'yes' }, 'blurScreenshots')).toHaveLength(1);
  });
});
