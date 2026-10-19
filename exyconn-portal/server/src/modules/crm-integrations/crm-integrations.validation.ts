import { z } from 'zod';
import { badRequest } from '../../utils/errors';
import { isE164Phone } from '../../utils/phoneNumber';

/** Twilio account SIDs are AC followed by 32 hex digits. */
const TWILIO_SID = /^AC[\da-f]{32}$/i;
/** Vobiz auth ids are short letters-and-digits identifiers. */
const PROVIDER_ID = /^[\w-]{4,100}$/;
/** A DLT sender id (India: 6 letters; elsewhere up to 11 letters or digits). */
const SENDER_ID = /^[a-z\d]{3,11}$/i;
const TEMPLATE_ID = /^[\w-]{1,64}$/;
const VARIABLE = /^[a-z_]\w{0,39}$/i;
export const MAX_SMS_LENGTH = 1000;

const label = z.string().trim().min(1, 'Give it a name').max(80, 'Keep the name under 80');
const e164 = z
  .string()
  .trim()
  .refine(isE164Phone, 'Enter the number in international format, e.g. +14155550100');
/** Blank on an edit keeps the stored token; a new config must have one (checked by the caller). */
const token = z.string().trim().max(200, 'That token is too long');
const twilioSid = z.string().trim().regex(TWILIO_SID, 'A Twilio Account SID starts with AC');

/** A Twilio account sends both calls and texts from one of its numbers. */
const twilioConfig = z.object({
  provider: z.literal('TWILIO'),
  label,
  fromNumber: e164,
  accountId: twilioSid,
  authToken: token,
  isActive: z.boolean(),
});
const vobizCall = twilioConfig.extend({
  provider: z.literal('VOBIZ'),
  accountId: z.string().trim().regex(PROVIDER_ID, 'Enter the Vobiz Auth ID'),
});
const callConfigSchema = z.discriminatedUnion('provider', [twilioConfig, vobizCall]);

const msg91Sms = z.object({
  provider: z.literal('MSG91'),
  label,
  authToken: token,
  senderId: z.string().trim().regex(SENDER_ID, 'Enter the DLT sender id, e.g. EXYCON'),
  templateId: z.string().trim().regex(TEMPLATE_ID, 'Enter the MSG91 flow template id'),
  messageVariable: z
    .string()
    .trim()
    .regex(VARIABLE, 'Enter the template variable that carries the message, e.g. message'),
  isActive: z.boolean(),
});
const smsConfigSchema = z.discriminatedUnion('provider', [twilioConfig, msg91Sms]);

export type CallConfigValues = z.infer<typeof callConfigSchema>;
export type SmsConfigValues = z.infer<typeof smsConfigSchema>;

/** Parses with a schema, refusing with the first problem in the words the form shows. */
function parsed<T>(schema: z.ZodType<T>, input: unknown): T {
  const result = schema.safeParse(input);
  if (!result.success) {
    badRequest(result.error.issues[0]?.message ?? 'Check the details and try again.');
  }
  return result.data;
}

export const parseCallConfig = (input: unknown) => parsed(callConfigSchema, input);
export const parseSmsConfig = (input: unknown) => parsed(smsConfigSchema, input);

/** A number the CRM dials or texts: E.164, or a refusal saying how to write it. */
export function checkedPhone(value: string, what: string): string {
  const phone = value.trim();
  if (!isE164Phone(phone)) {
    badRequest(`Enter ${what} in international format, e.g. +14155550100.`);
  }
  return phone;
}

/** An SMS body: 1–1000 characters once trimmed. */
export function checkedSmsBody(value: string): string {
  const body = value.trim();
  if (body === '' || body.length > MAX_SMS_LENGTH) {
    badRequest(`Write a message of 1 to ${MAX_SMS_LENGTH} characters.`);
  }
  return body;
}
