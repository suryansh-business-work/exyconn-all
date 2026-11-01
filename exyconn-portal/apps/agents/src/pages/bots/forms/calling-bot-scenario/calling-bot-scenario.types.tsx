import { z } from 'zod';
import type { SelectOption } from '@exyconn/shell/components/form/rhf';
import type { CallingBotScenariosQuery } from '@exyconn/shell/graphql/generated';
import { LANGUAGE_OPTIONS } from '../calling-bot-config/calling-bot-config.types';

export type CallingBotScenarioRow = CallingBotScenariosQuery['callingBotScenarios'][number];

/**
 * The form's stand-in for "no language of its own" (stored as ''): a select cannot show a
 * label for an empty value.
 */
export const SETTINGS_LANGUAGE = 'settings';

/** An example speaks the config's language unless it names its own. */
export const SCENARIO_LANGUAGE_OPTIONS: SelectOption[] = [
  { value: SETTINGS_LANGUAGE, label: 'Same as the active settings' },
  ...LANGUAGE_OPTIONS,
];

export const callingBotScenarioSchema = z.object({
  title: z.string().trim().min(3, 'Title is required').max(80, 'At most 80 characters'),
  description: z
    .string()
    .trim()
    .min(10, 'Say in a line what the visitor can try')
    .max(200, 'At most 200 characters'),
  systemPrompt: z
    .string()
    .trim()
    .min(20, 'Describe the bot in at least a sentence')
    .max(4000, 'At most 4000 characters'),
  greeting: z.string().trim().min(2, 'Greeting is required').max(300, 'At most 300 characters'),
  languageCode: z.string().min(1, 'Language is required'),
  enabled: z.boolean(),
  order: z.coerce
    .number({ error: 'Enter a number' })
    .int('Use a whole number')
    .min(0, 'At least 0')
    .max(10_000, 'At most 10000'),
});

export type CallingBotScenarioSchema = typeof callingBotScenarioSchema;
export type CallingBotScenarioValues = z.infer<CallingBotScenarioSchema>;
