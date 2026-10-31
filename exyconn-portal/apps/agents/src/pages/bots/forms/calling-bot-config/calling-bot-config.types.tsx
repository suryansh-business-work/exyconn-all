import { z } from 'zod';
import { E164_PHONE, TWILIO_ACCOUNT_SID } from '@exyconn/regex';
import type { SelectOption } from '@exyconn/shell/components/form/rhf';
import {
  CallingBotPhoneProvider,
  type CallingBotConfigsQuery,
} from '@exyconn/shell/graphql/generated';
import { secretField } from '@exyconn/shell/utils/secret';

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

/** Who rings real phones; with no provider the demo offers the browser call only. */
export const PHONE_PROVIDER_OPTIONS: SelectOption[] = [
  { value: CallingBotPhoneProvider.None, label: 'No phone calls (browser call only)' },
  { value: CallingBotPhoneProvider.Vobiz, label: 'Vobiz' },
  { value: CallingBotPhoneProvider.Twilio, label: 'Twilio' },
];

const e164 = z
  .string()
  .trim()
  .refine((value) => value === '' || E164_PHONE.test(value), 'Use E.164, e.g. +918012345678');

/** A field the chosen phone provider cannot work without. */
interface Needed {
  field:
    | 'vobizAuthId'
    | 'vobizAuthToken'
    | 'vobizNumber'
    | 'twilioAccountSid'
    | 'twilioAuthToken'
    | 'twilioNumber';
  message: string;
  /** A saved secret satisfies it on an edit, so it is required only when creating. */
  secret?: boolean;
}

const NEEDED: Record<CallingBotPhoneProvider, Needed[]> = {
  [CallingBotPhoneProvider.None]: [],
  [CallingBotPhoneProvider.Vobiz]: [
    { field: 'vobizAuthId', message: 'Vobiz Auth ID is required' },
    { field: 'vobizAuthToken', message: 'Vobiz Auth Token is required', secret: true },
    { field: 'vobizNumber', message: 'The Vobiz calling number is required' },
  ],
  [CallingBotPhoneProvider.Twilio]: [
    { field: 'twilioAccountSid', message: 'Twilio Account SID is required' },
    { field: 'twilioAuthToken', message: 'Twilio Auth Token is required', secret: true },
    { field: 'twilioNumber', message: 'The Twilio calling number is required' },
  ],
};

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
      phoneProvider: z.enum(CallingBotPhoneProvider),
      vobizAuthId: z.string().trim(),
      vobizAuthToken: z.string().trim(),
      vobizNumber: e164,
      twilioAccountSid: z
        .string()
        .trim()
        .refine(
          (value) => value === '' || TWILIO_ACCOUNT_SID.test(value),
          'A Twilio Account SID starts with AC and has 34 characters',
        ),
      twilioAuthToken: z.string().trim(),
      twilioNumber: e164,
      isActive: z.enum(['true', 'false']),
    })
    .superRefine((values, ctx) => {
      for (const { field, message, secret } of NEEDED[values.phoneProvider]) {
        if (values[field] === '' && !(secret && isEdit)) {
          ctx.addIssue({ code: 'custom', path: [field], message });
        }
      }
    });

export type CallingBotConfigSchema = ReturnType<typeof makeSchema>;
export type CallingBotConfigValues = z.infer<CallingBotConfigSchema>;
