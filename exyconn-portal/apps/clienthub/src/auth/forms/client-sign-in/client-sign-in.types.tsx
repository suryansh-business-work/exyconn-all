import { z } from 'zod';
import { EMAIL, ONE_TIME_CODE } from '@exyconn/regex';

export const emailSchema = z.object({
  email: z.string().trim().min(1, 'Email is required').regex(EMAIL, 'Enter a valid email'),
});

export const codeSchema = z.object({
  code: z.string().trim().regex(ONE_TIME_CODE, 'Enter the six-digit code from the email'),
});

export type EmailValues = z.infer<typeof emailSchema>;
export type CodeValues = z.infer<typeof codeSchema>;
