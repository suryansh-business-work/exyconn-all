import { EMAIL } from '@exyconn/regex';
import { z } from 'zod';

/** The portal's own sign-in rules — the phone signs in to the same accounts. */
export const loginSchema = z.object({
  email: z.string().trim().min(1, 'Enter your email.').regex(EMAIL, 'Enter a valid email.'),
  password: z
    .string()
    .min(1, 'Enter your password.')
    .min(6, 'Passwords are at least 6 characters.'),
  rememberMe: z.boolean(),
});
