import { describe, expect, it } from 'vitest';
import {
  itSettingsSchema,
  toItSettingsValues,
} from '../../../../../../src/pages/settings/forms/it-settings';
import { settingsRow } from '../../../page-kit/fixtures';

const valid = toItSettingsValues(settingsRow());

function firstError(value: unknown): string | null {
  const result = itSettingsSchema.safeParse(value);
  return result.success ? null : (result.error.issues[0]?.message ?? 'invalid');
}

describe('itSettingsSchema', () => {
  it('accepts the saved settings and coerces typed day counts', () => {
    expect(
      itSettingsSchema.parse({ ...valid, warrantyWarningDays: '90' }).warrantyWarningDays,
    ).toBe(90);
  });

  it('keeps every warning between one day and a year, in whole days', () => {
    expect(firstError({ ...valid, warrantyWarningDays: 0 })).toBe('At least one day');
    expect(firstError({ ...valid, renewalWarningDays: 366 })).toBe('At most 365 days');
    expect(firstError({ ...valid, certificateWarningDays: 1.5 })).toBe('Whole days only');
    expect(firstError({ ...valid, certificateWarningDays: 365 })).toBeNull();
  });

  it('names the warning that is not a number', () => {
    expect(firstError({ ...valid, warrantyWarningDays: 'soon' })).toBe(
      'Warranty warning must be a number',
    );
    expect(firstError({ ...valid, renewalWarningDays: 'soon' })).toBe(
      'Renewal warning must be a number',
    );
    expect(firstError({ ...valid, certificateWarningDays: 'soon' })).toBe(
      'Certificate warning must be a number',
    );
  });

  it('keeps each listed name under 80 characters', () => {
    expect(firstError({ ...valid, ticketTopics: ['t'.repeat(81)] })).toBe(
      'Keep each name under 80 characters',
    );
  });

  it('matches onboarding applications to the list regardless of case', () => {
    expect(
      firstError({ ...valid, applications: ['Email', 'Slack'], onboardingApplications: ['slack'] }),
    ).toBeNull();
  });

  it('reports an unlisted onboarding application on that field', () => {
    const result = itSettingsSchema.safeParse({ ...valid, onboardingApplications: ['Zoom'] });
    expect(result.error?.issues[0]).toMatchObject({
      message: 'Only applications from the list above',
      path: ['onboardingApplications'],
    });
  });
});

describe('toItSettingsValues', () => {
  it('falls back to empty lists and the standard warning windows', () => {
    const defaults = {
      applications: [],
      onboardingApplications: [],
      ticketTopics: [],
      warrantyWarningDays: 60,
      renewalWarningDays: 30,
      certificateWarningDays: 30,
    };
    expect(toItSettingsValues(null)).toEqual(defaults);
    expect(toItSettingsValues(undefined)).toEqual(defaults);
  });

  it('copies the saved settings, leaving out the bookkeeping', () => {
    const row = settingsRow({ warrantyWarningDays: 90, certificateWarningDays: 14 });
    expect(toItSettingsValues(row)).toEqual({
      applications: ['Email', 'Slack'],
      onboardingApplications: ['Email'],
      ticketTopics: ['Hardware'],
      warrantyWarningDays: 90,
      renewalWarningDays: 30,
      certificateWarningDays: 14,
    });
  });
});
