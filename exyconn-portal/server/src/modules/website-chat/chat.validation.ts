import { z } from 'zod';
import { badRequest } from '../../utils/errors';
import { isEmailAddress } from '../../utils/emailAddress';
import { isPhoneNumber } from '../../utils/phoneNumber';
import { isValidTimezone } from '../../utils/timezone';
import { CHAT_SITES } from './models';

/** Longest message a visitor or an agent may send, and the most files with one message. */
export const CHAT_LIMITS = { body: 2000, files: 4, name: 120, pageUrl: 500 } as const;

/** No link or address in a name: it is printed in an email to the address given. */
const LINK_LIKE = /[@/]|www\.|\.(?:com|net|org|io|ru|xyz)\b/i;
const HH_MM = /^(?:[01]\d|2[0-3]):[0-5]\d$/;

const name = z
  .string()
  .trim()
  .min(1, 'Enter your name.')
  .max(CHAT_LIMITS.name, 'Keep your name shorter.')
  .refine((value) => !LINK_LIKE.test(value), 'Enter your name without links or email addresses.');
const email = z
  .string()
  .trim()
  .toLowerCase()
  .refine(isEmailAddress, 'Enter a valid email address.');
const phone = z
  .string()
  .trim()
  .refine((value) => value === '' || isPhoneNumber(value), 'Enter a valid phone number.')
  .default('');
const pageUrl = z.string().trim().max(CHAT_LIMITS.pageUrl).default('');
const body = z.string().trim().max(CHAT_LIMITS.body, 'Keep the message under 2000 characters.');
const files = z
  .array(z.object({ name: z.string().trim().min(1).max(120), data: z.string().min(1) }))
  .max(CHAT_LIMITS.files, 'Send at most four files at a time.')
  .default([]);

/** Who the visitor says they are; the email is what the code proves. */
export const identitySchema = z.object({ name, email, phone, pageUrl, site: z.enum(CHAT_SITES) });
export type ChatIdentity = z.infer<typeof identitySchema>;

export const helloSchema = z.discriminatedUnion('role', [
  z.object({
    t: z.literal('hello'),
    role: z.literal('visitor'),
    site: z.enum(CHAT_SITES),
    token: z.string().max(2000).optional(),
  }),
  z.object({ t: z.literal('hello'), role: z.literal('staff'), token: z.string().min(1).max(4000) }),
]);

/** What a signed-out or signed-in visitor's widget may send. */
export const visitorFrameSchema = z.discriminatedUnion('t', [
  z.object({ t: z.literal('requestCode'), name, email, phone, pageUrl }),
  z.object({
    t: z.literal('verifyCode'),
    name,
    email,
    phone,
    pageUrl,
    code: z
      .string()
      .trim()
      .regex(/^\d{6}$/, 'Enter the 6-digit code from the email.'),
  }),
  z.object({
    t: z.literal('send'),
    clientId: z.string().max(64),
    channel: z.enum(['LIVE', 'KNOWLEDGE']),
    body,
    files,
  }),
  z.object({ t: z.literal('typing'), on: z.boolean() }),
  z.object({ t: z.literal('read') }),
  z.object({ t: z.literal('end') }),
  z.object({ t: z.literal('newChat') }),
  z.object({ t: z.literal('getConfig') }),
  z.object({ t: z.literal('ping') }),
]);
export type VisitorFrame = z.infer<typeof visitorFrameSchema>;

const sessionId = z.string().regex(/^[a-f\d]{24}$/i, 'Unknown chat.');

/** What Website > Chatbot > Sessions may send over the socket. */
export const staffFrameSchema = z.discriminatedUnion('t', [
  z.object({ t: z.literal('watch'), sessionId: sessionId.nullable() }),
  z.object({ t: z.literal('send'), sessionId, clientId: z.string().max(64), body, files }),
  z.object({ t: z.literal('typing'), sessionId, on: z.boolean() }),
  z.object({ t: z.literal('read'), sessionId }),
  z.object({ t: z.literal('ping') }),
]);
export type StaffFrame = z.infer<typeof staffFrameSchema>;

const daySchema = z
  .object({
    day: z.number().int().min(0).max(6),
    enabled: z.boolean(),
    start: z.string().regex(HH_MM, 'Use 24-hour HH:mm.'),
    end: z.string().regex(HH_MM, 'Use 24-hour HH:mm.'),
  })
  .refine((day) => day.start !== day.end, 'Opening and closing time cannot be the same.');

const text = (min: number, max: number) => z.string().trim().min(min).max(max);

/** Website > Chatbot > Settings, checked again here: the client is never the only gate. */
export const settingsSchema = z.object({
  enabled: z.boolean(),
  botName: text(2, 60),
  welcomeMessage: text(5, 500),
  offlineMessage: text(5, 500),
  handoffMessage: text(5, 500),
  refusalMessage: text(5, 500),
  customInstructions: text(0, 2000),
  timezone: z.string().refine(isValidTimezone, 'Choose a valid timezone.'),
  weeklyHours: z
    .array(daySchema)
    .length(7, 'Give hours for all seven days.')
    .refine((days) => new Set(days.map((day) => day.day)).size === 7, 'Each day appears once.'),
  noReplyTimeoutSeconds: z.number().int().min(30).max(3600),
  botModel: text(2, 60),
  maxContextChars: z.number().int().min(2000).max(60000),
  allowUploads: z.boolean(),
  maxUploadMb: z.number().int().min(1).max(10),
  soundEnabledByDefault: z.boolean(),
  transcriptOnClose: z.boolean(),
});
export type ChatSettingsInput = z.infer<typeof settingsSchema>;

/** Parses `value`, refusing with the first problem in words the person can act on. */
export function parseInput<T extends z.ZodType>(schema: T, value: unknown): z.infer<T> {
  const parsed = schema.safeParse(value);
  if (!parsed.success) {
    badRequest(parsed.error.issues[0]?.message ?? 'That request is not valid.');
  }
  return parsed.data;
}
