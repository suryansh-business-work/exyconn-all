import { z } from 'zod';
import { EMAIL } from '@exyconn/regex';

export const emailCheckSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, 'Enter an email address')
    .max(254, 'An email address is at most 254 characters')
    .regex(EMAIL, 'Enter a valid email address, e.g. name@company.com'),
});

export type EmailCheckValues = z.infer<typeof emailCheckSchema>;
