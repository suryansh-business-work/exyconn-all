import { z } from 'zod';
import { EMAIL } from '@exyconn/regex';

/** Mirrors the address the API will accept, so both surfaces reject the same things. */
export const subscribeSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, 'Enter your email address')
    .regex(EMAIL, 'Enter a valid email address')
    .max(200, 'That address is too long'),
});

export const SUBSCRIBE_DEFAULTS = { email: '' };
