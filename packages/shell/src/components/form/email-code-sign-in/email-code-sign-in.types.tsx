import { z } from 'zod';
import { EMAIL, ONE_TIME_CODE } from '@exyconn/regex';

/** Step one: the address that was given access. */
export const signInEmailSchema = z.object({
  email: z.string().trim().min(1, 'Email is required').regex(EMAIL, 'Enter a valid email'),
});

/** Step two: the six digits from the email. */
export const signInCodeSchema = z.object({
  code: z.string().trim().regex(ONE_TIME_CODE, 'Enter the six-digit code from the email'),
});

export type SignInEmailValues = z.infer<typeof signInEmailSchema>;
export type SignInCodeValues = z.infer<typeof signInCodeSchema>;

/** What a pass-holder app (a vendor portal, say) plugs into the shared email-and-code sign-in. */
export interface EmailCodeSignInProps {
  /** The login page's accent, from Admin › Branding › Login Pages. */
  accentColor: string;
  /** Emails a code to the address; throws with a sentence the person can act on. */
  requestCode: (email: string) => Promise<void>;
  /** Checks the code and answers the app's pass, or undefined when none came back. */
  verifyCode: (email: string, code: string) => Promise<string | undefined>;
  /** Called with the pass once the code checks out. */
  onSignedIn: (pass: string) => void;
}
