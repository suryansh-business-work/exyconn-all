import { z } from 'zod';
import { E164_PHONE } from '@exyconn/regex';
import type { SelectOption } from '@exyconn/shell/components/form/rhf';
import type { CallingBotConfigsQuery } from '@exyconn/shell/graphql/generated';
import { secretField } from '../../../environment-variables/secret';

export type CallingBotConfigRow = CallingBotConfigsQuery['callingBotConfigs'][number];

/** The languages Sarvam AI listens and speaks in (docs.sarvam.ai), as BCP-47 codes. */
export const LANGUAGE_OPTIONS: SelectOption[] = [
  { value: 'hi-IN', label: 'Hindi' },
  { value: 'en-IN', label: 'English (India)' },
  { value: 'bn-IN', label: 'Bengali' },
  { value: 'gu-IN', label: 'Gujarati' },
  { value: 'kn-IN', label: 'Kannada' },
  { value: 'ml-IN', label: 'Malayalam' },
  { value: 'mr-IN', label: 'Marathi' },
  { value: 'od-IN', label: 'Odia' },
  { value: 'pa-IN', label: 'Punjabi' },
  { value: 'ta-IN', label: 'Tamil' },
  { value: 'te-IN', label: 'Telugu' },
];

/** Sarvam's text-to-speech models, and the voices each one has. */
export const VOICES: Record<string, string[]> = {
  'bulbul:v2': ['anushka', 'manisha', 'vidya', 'arya', 'abhilash', 'karun', 'hitesh'],
  'bulbul:v3': [
    'shubh',
    'aditya',
    'ritu',
    'priya',
    'neha',
    'rahul',
    'pooja',
    'rohan',
    'simran',
    'kavya',
    'amit',
    'dev',
    'ishita',
    'shreya',
  ],
};

export const MODEL_OPTIONS: SelectOption[] = Object.keys(VOICES).map((value) => ({
  value,
  label: value,
}));

export const BOOL_OPTIONS: SelectOption[] = [
  { value: 'true', label: 'Yes' },
  { value: 'false', label: 'No' },
];

/** A Vobiz setting is all-or-nothing: either every field is filled in, or phone calls are off. */
const vobizComplete = (values: { vobizAuthId: string; vobizNumber: string }) =>
  values.vobizAuthId === '' || values.vobizNumber !== '';

/** Keys are required to create; blank on an edit keeps the saved one (its eye button shows it). */
export const makeSchema = (isEdit: boolean) =>
  z
    .object({
      label: z.string().trim().min(1, 'Label is required'),
      sarvamApiKey: secretField(isEdit, 'Sarvam AI key is required'),
      openAiApiKey: secretField(isEdit, 'OpenAI key is required', {
        test: (value) => value.startsWith('sk-'),
        message: 'OpenAI keys start with "sk-"',
      }),
      openAiModel: z.string().trim().min(1, 'Model is required'),
      systemPrompt: z.string().trim().min(20, 'Describe the bot in at least a sentence').max(4000),
      greeting: z.string().trim().min(2, 'Greeting is required').max(300),
      languageCode: z.string().min(1, 'Language is required'),
      ttsModel: z.string().min(1, 'Voice model is required'),
      ttsSpeaker: z.string().min(1, 'Voice is required'),
      maxCallSeconds: z.coerce
        .number()
        .int()
        .min(30, 'At least 30 seconds')
        .max(900, 'At most 15 minutes'),
      vobizAuthId: z.string().trim(),
      vobizAuthToken: z.string().trim(),
      vobizNumber: z
        .string()
        .trim()
        .refine((value) => value === '' || E164_PHONE.test(value), 'Use E.164, e.g. +918012345678'),
      isActive: z.enum(['true', 'false']),
    })
    .refine(vobizComplete, { path: ['vobizNumber'], message: 'A Vobiz account needs its number' });

export type CallingBotConfigSchema = ReturnType<typeof makeSchema>;
export type CallingBotConfigValues = z.infer<CallingBotConfigSchema>;
