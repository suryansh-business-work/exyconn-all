import { isMatch } from 'date-fns';
import { z } from 'zod';
import { isValidTimezone } from '@exyconn/i18n';
import type { WebsiteChatSettingsFieldsFragment } from '@exyconn/shell/graphql/generated';

export type ChatSettingsRow = WebsiteChatSettingsFieldsFragment;

/** Weekday names in the server's order: day 0 is Sunday. */
export const WEEKDAYS = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
] as const;

const time = z
  .string()
  .min(1, 'Pick a time')
  .refine((value) => isMatch(value, 'HH:mm'), 'Pick a time');

const daySchema = z
  .object({
    day: z.number().int().min(0).max(6),
    enabled: z.boolean(),
    start: time,
    end: time,
  })
  .refine((day) => day.start !== day.end, {
    message: 'Opening and closing time cannot be the same',
    path: ['end'],
  });

const text = (label: string, min: number, max: number) =>
  z
    .string()
    .trim()
    .min(min, `${label} needs at least ${min} characters`)
    .max(max, `Keep ${label.toLowerCase()} under ${max} characters`);

const whole = (label: string, min: number, max: number) =>
  z.coerce
    .number({ message: `${label} must be a number` })
    .int(`${label} must be a whole number`)
    .min(min, `${label} must be at least ${min}`)
    .max(max, `${label} can be at most ${max}`);

/** Website > Chatbot > Settings. The limits are the server's (chat.validation.ts settingsSchema). */
export const chatSettingsSchema = z.object({
  enabled: z.boolean(),
  botName: text('Bot name', 2, 60),
  welcomeMessage: text('Welcome message', 5, 500),
  offlineMessage: text('Offline message', 5, 500),
  handoffMessage: text('Handoff message', 5, 500),
  refusalMessage: text('Refusal message', 5, 500),
  customInstructions: z.string().trim().max(2000, 'Keep custom instructions under 2000 characters'),
  timezone: z
    .string()
    .min(1, 'Timezone is required')
    .refine((value) => isValidTimezone(value), 'Choose a timezone from the list'),
  weeklyHours: z.array(daySchema).length(7, 'Give hours for all seven days'),
  noReplyTimeoutSeconds: whole('No-reply timeout', 30, 3600),
  botModel: text('Bot model', 2, 60),
  maxContextChars: whole('Knowledge per question', 2000, 60000),
  allowUploads: z.boolean(),
  maxUploadMb: whole('Largest upload', 1, 10),
  soundEnabledByDefault: z.boolean(),
  transcriptOnClose: z.boolean(),
  sessionTimeoutMinutes: whole('Session timeout', 2, 120),
  embeddingModel: text('Embedding model', 2, 60),
  agentIds: z
    .array(z.string().min(1, 'Choose agents from the list'))
    .max(50, 'Choose at most 50 agents'),
  slackEnabled: z.boolean(),
});

export type ChatSettingsFormInput = z.input<typeof chatSettingsSchema>;
export type ChatSettingsFormValues = z.output<typeof chatSettingsSchema>;

/** The saved settings as form values: the seven days in order, Sunday first. */
export function toChatSettingsValues(row: ChatSettingsRow): ChatSettingsFormValues {
  return {
    enabled: row.enabled,
    botName: row.botName,
    welcomeMessage: row.welcomeMessage,
    offlineMessage: row.offlineMessage,
    handoffMessage: row.handoffMessage,
    refusalMessage: row.refusalMessage,
    customInstructions: row.customInstructions,
    timezone: row.timezone,
    weeklyHours: row.weeklyHours
      .map(({ day, enabled, start, end }) => ({ day, enabled, start, end }))
      .sort((a, b) => a.day - b.day),
    noReplyTimeoutSeconds: row.noReplyTimeoutSeconds,
    botModel: row.botModel,
    maxContextChars: row.maxContextChars,
    allowUploads: row.allowUploads,
    maxUploadMb: row.maxUploadMb,
    soundEnabledByDefault: row.soundEnabledByDefault,
    transcriptOnClose: row.transcriptOnClose,
    sessionTimeoutMinutes: row.sessionTimeoutMinutes,
    embeddingModel: row.embeddingModel,
    agentIds: [...row.agentIds],
    slackEnabled: row.slackEnabled,
  };
}
