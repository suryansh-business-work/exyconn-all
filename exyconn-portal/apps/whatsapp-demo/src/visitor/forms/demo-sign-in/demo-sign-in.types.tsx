import { z } from 'zod';
import { EMAIL, ONE_TIME_CODE } from '@exyconn/regex';

/** Step one: who is asking. The code is sent to this address. */
export const detailsSchema = z.object({
  name: z.string().trim().min(1, 'Enter your name').max(120, 'Keep the name under 120 characters'),
  email: z.string().trim().min(1, 'Work email is required').regex(EMAIL, 'Enter a valid email'),
});

/** Step two: the six digits from the email. */
export const codeSchema = z.object({
  code: z.string().trim().regex(ONE_TIME_CODE, 'Enter the six-digit code from the email'),
});

export type DetailsValues = z.infer<typeof detailsSchema>;
export type CodeValues = z.infer<typeof codeSchema>;
