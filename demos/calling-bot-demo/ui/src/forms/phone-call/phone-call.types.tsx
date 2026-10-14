import { z } from 'zod';
import { E164_PHONE } from '@exyconn/regex';

/** The number the bot rings, with its country code: Vobiz dials E.164. */
export const phoneCallSchema = z.object({
  phone: z
    .string()
    .trim()
    .min(1, 'Enter the number to call')
    .regex(E164_PHONE, 'Use the country code and digits only, e.g. +919876543210'),
});

export type PhoneCallValues = z.infer<typeof phoneCallSchema>;
