import type { SignInStep } from '../../../services/auth';

/** The password step's fields. */
export interface PasswordValues {
  email: string;
  password: string;
}

/** The two-factor step's field: an authenticator code or a recovery code. */
export interface CodeValues {
  code: string;
}

export interface SignInFormProps {
  /** Sends the email and password to the worker; answers whether a code is needed next. */
  submitPassword: (values: PasswordValues) => Promise<SignInStep>;
  /** Sends the two-factor code with the challenge the password step returned. */
  submitCode: (challenge: string, code: string) => Promise<SignInStep>;
  /** Called once the extension is signed in. */
  onSignedIn: () => void;
}
