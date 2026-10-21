import { describe, expect, it } from 'vitest';
import { meetingSettingsSchema, toSettingsValues } from '../../../src/forms/meeting-settings';
import { makeSettings } from '../fixtures';

const valid = () => toSettingsValues(makeSettings());
const errorsFor = (patch: Record<string, unknown>) => {
  const result = meetingSettingsSchema.safeParse({ ...valid(), ...patch });
  return result.success ? [] : result.error.issues.map((issue) => issue.path.join('.'));
};

describe('meetingSettingsSchema', () => {
  it('accepts the loaded settings and leaves out the read-only fields', () => {
    const values = valid();
    expect(values).not.toHaveProperty('monthSpendUsd');
    expect(values).not.toHaveProperty('updatedByName');
    expect(
      meetingSettingsSchema.parse({ ...values, maxRemindersPerMeeting: '4' })
        .maxRemindersPerMeeting,
    ).toBe(4);
  });

  it('holds the numbers to the limits the server enforces', () => {
    expect(errorsFor({ maxRemindersPerMeeting: 0 })).toEqual(['maxRemindersPerMeeting']);
    expect(errorsFor({ maxRemindersPerMeeting: 31 })).toEqual(['maxRemindersPerMeeting']);
    expect(errorsFor({ transcriptRetentionDays: -1 })).toEqual(['transcriptRetentionDays']);
    expect(errorsFor({ transcriptRetentionDays: 3651 })).toEqual(['transcriptRetentionDays']);
    expect(errorsFor({ maxMeetingMinutes: 4 })).toEqual(['maxMeetingMinutes']);
    expect(errorsFor({ maxMeetingMinutes: 1441 })).toEqual(['maxMeetingMinutes']);
    expect(errorsFor({ monthlyBudgetUsd: -1 })).toEqual(['monthlyBudgetUsd']);
    expect(errorsFor({ reminderIntervalMinutes: 3 })).toEqual(['reminderIntervalMinutes']);
    expect(errorsFor({ maxRemindersPerMeeting: 2.5 })).toEqual(['maxRemindersPerMeeting']);
  });

  it('checks every recipient is an email and every domain a bare domain', () => {
    expect(errorsFor({ defaultRecipients: ['team@example.com', 'nope'] })).toEqual([
      'defaultRecipients',
    ]);
    expect(errorsFor({ emailAllowedDomains: ['https://example.com'] })).toEqual([
      'emailAllowedDomains',
    ]);
  });

  it('requires both model names', () => {
    expect(new Set(errorsFor({ analysisModel: ' ', transcriptionModel: '' }))).toEqual(
      new Set(['analysisModel', 'transcriptionModel']),
    );
  });

  it('takes any model id without spaces, a custom fine-tune too, and trims it', () => {
    const parsed = meetingSettingsSchema.parse({
      ...valid(),
      analysisModel: ' ft:gpt-4o-mini:acme::abc123 ',
      transcriptionModel: 'gpt-4o-transcribe',
    });
    expect(parsed.analysisModel).toBe('ft:gpt-4o-mini:acme::abc123');
    expect(errorsFor({ analysisModel: 'gpt 4o' })).toEqual(['analysisModel']);
    expect(errorsFor({ transcriptionModel: 'whisper?' })).toEqual(['transcriptionModel']);
    expect(errorsFor({ analysisModel: 'g'.repeat(101) })).toEqual(['analysisModel']);
  });
});
