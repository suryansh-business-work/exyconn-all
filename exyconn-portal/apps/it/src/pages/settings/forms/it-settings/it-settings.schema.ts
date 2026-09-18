import { z } from 'zod';
import type { ItSettingsRow, ItSettingsValues } from './it-settings.types';

/** Warnings further out than a year stop being warnings. */
const MAX_WARNING_DAYS = 365;

const warningDays = (label: string) =>
  z.coerce
    .number({ message: `${label} must be a number` })
    .int('Whole days only')
    .min(1, 'At least one day')
    .max(MAX_WARNING_DAYS, `At most ${MAX_WARNING_DAYS} days`);

const names = z.array(z.string().trim().min(1).max(80, 'Keep each name under 80 characters'));

export const itSettingsSchema = z
  .object({
    applications: names,
    onboardingApplications: names,
    ticketTopics: names,
    warrantyWarningDays: warningDays('Warranty warning'),
    renewalWarningDays: warningDays('Renewal warning'),
    certificateWarningDays: warningDays('Certificate warning'),
  })
  .refine(
    (v) => {
      const known = new Set(v.applications.map((app) => app.toLowerCase()));
      return v.onboardingApplications.every((app) => known.has(app.toLowerCase()));
    },
    { message: 'Only applications from the list above', path: ['onboardingApplications'] },
  );

export function toItSettingsValues(row: ItSettingsRow | null | undefined): ItSettingsValues {
  return {
    applications: row?.applications ?? [],
    onboardingApplications: row?.onboardingApplications ?? [],
    ticketTopics: row?.ticketTopics ?? [],
    warrantyWarningDays: row?.warrantyWarningDays ?? 60,
    renewalWarningDays: row?.renewalWarningDays ?? 30,
    certificateWarningDays: row?.certificateWarningDays ?? 30,
  };
}
