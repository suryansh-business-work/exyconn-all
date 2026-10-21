import { z } from 'zod';
import { DOMAIN, EMAIL } from '@exyconn/regex';
import { MaLanguage, MaReleaseChannel, MaSummaryStyle } from '@exyconn/shell/graphql/generated';
import type { MeetingSettingsInput, MeetingSettingsRow } from './meeting-settings.types';

/** How often the extension may remind somebody to start recording, in minutes. */
export const REMINDER_INTERVALS = [1, 2, 5, 10] as const;

/** The server's limits, so the form refuses what the server would. */
export const LIMITS = {
  reminders: { min: 1, max: 30 },
  retentionDays: { min: 0, max: 3650 },
  audioRetentionDays: { min: 0, max: 3650 },
  meetingMinutes: { min: 5, max: 1440 },
} as const;

const whole = (min: number, max: number, message: string) =>
  z.coerce
    .number({ message: 'Enter a number' })
    .int('Enter a whole number')
    .min(min, message)
    .max(max, message);

export const meetingSettingsSchema = z.object({
  enabled: z.boolean(),
  saveRecordings: z.boolean(),
  audioRetentionDays: whole(
    LIMITS.audioRetentionDays.min,
    LIMITS.audioRetentionDays.max,
    'Between 0 and 3,650 days',
  ),
  allowedUserIds: z.array(z.string()),
  remindersEnabled: z.boolean(),
  reminderIntervalMinutes: z.coerce
    .number()
    .refine(
      (value) => (REMINDER_INTERVALS as readonly number[]).includes(value),
      'Pick an interval',
    ),
  maxRemindersPerMeeting: whole(LIMITS.reminders.min, LIMITS.reminders.max, 'Between 1 and 30'),
  preferredLanguage: z.enum(MaLanguage),
  summaryStyle: z.enum(MaSummaryStyle),
  transcriptRetentionDays: whole(
    LIMITS.retentionDays.min,
    LIMITS.retentionDays.max,
    'Between 0 and 3,650 days',
  ),
  autoGenerateSummary: z.boolean(),
  autoEmail: z.boolean(),
  emailRequiresApproval: z.boolean(),
  // Checked as a whole list, so the message shows under the field rather than on a chip.
  defaultRecipients: z
    .array(z.string().trim())
    .refine(
      (list) => list.every((email) => EMAIL.test(email)),
      'Every recipient must be an email address',
    ),
  emailParticipants: z.boolean(),
  emailAllowedDomains: z
    .array(z.string().trim())
    .refine(
      (list) => list.every((domain) => DOMAIN.test(domain)),
      'Enter domains like example.com',
    ),
  analysisModel: z
    .string()
    .trim()
    .min(1, 'The analysis model is required')
    .max(100, 'Keep it under 100 characters'),
  transcriptionModel: z
    .string()
    .trim()
    .min(1, 'The transcription model is required')
    .max(100, 'Keep it under 100 characters'),
  diarization: z.boolean(),
  monthlyBudgetUsd: z.coerce
    .number({ message: 'Enter a number' })
    .min(0, 'The budget cannot be negative'),
  maxMeetingMinutes: whole(
    LIMITS.meetingMinutes.min,
    LIMITS.meetingMinutes.max,
    'Between 5 and 1,440 minutes',
  ),
  participantTracking: z.boolean(),
  liveTranscript: z.boolean(),
  releaseChannel: z.enum(MaReleaseChannel),
});

export type MeetingSettingsFormInput = z.input<typeof meetingSettingsSchema>;
export type MeetingSettingsValues = z.output<typeof meetingSettingsSchema>;

/** The loaded settings as the form's starting values (the read-only fields left out). */
export function toSettingsValues(row: MeetingSettingsRow): MeetingSettingsInput {
  return {
    enabled: row.enabled,
    saveRecordings: row.saveRecordings,
    audioRetentionDays: row.audioRetentionDays,
    allowedUserIds: row.allowedUserIds,
    remindersEnabled: row.remindersEnabled,
    reminderIntervalMinutes: row.reminderIntervalMinutes,
    maxRemindersPerMeeting: row.maxRemindersPerMeeting,
    preferredLanguage: row.preferredLanguage,
    summaryStyle: row.summaryStyle,
    transcriptRetentionDays: row.transcriptRetentionDays,
    autoGenerateSummary: row.autoGenerateSummary,
    autoEmail: row.autoEmail,
    emailRequiresApproval: row.emailRequiresApproval,
    defaultRecipients: row.defaultRecipients,
    emailParticipants: row.emailParticipants,
    emailAllowedDomains: row.emailAllowedDomains,
    analysisModel: row.analysisModel,
    transcriptionModel: row.transcriptionModel,
    diarization: row.diarization,
    monthlyBudgetUsd: row.monthlyBudgetUsd,
    maxMeetingMinutes: row.maxMeetingMinutes,
    participantTracking: row.participantTracking,
    liveTranscript: row.liveTranscript,
    releaseChannel: row.releaseChannel,
  };
}
