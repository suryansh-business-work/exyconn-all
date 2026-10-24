import type { SignInStep } from '../../../services/auth';

/** The password step's fields. */
export interface PasswordValues {
  email: string;
  password: string;
  /** Stay signed in after the browser closes. */
  remember: boolean;
}

/** The two-factor step's field: an authenticator code or a recovery code. */
export interface CodeValues {
  code: string;
}

export interface SignInFormProps {
  /** Sends the email and password to the worker; answers whether a code is needed next. */
  submitPassword: (values: PasswordValues) => Promise<SignInStep>;
  /** Sends the two-factor code with the challenge, and the password step's "Remember me". */
  submitCode: (challenge: string, code: string, remember: boolean) => Promise<SignInStep>;
  /** Called once the extension is signed in. */
  onSignedIn: () => void;
}
