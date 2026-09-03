import { TrackerAuthError } from './portal-client';
import { httpStatusOf } from './portal-error';

const OFFLINE =
  'Cannot reach the portal. Check your internet connection, then try signing in again.';
const UNAVAILABLE = 'The portal is temporarily unavailable. Please try again in a few minutes.';
const OUTDATED =
  'This version of the tracker can no longer talk to the portal. Please install the latest version of the app.';
const GENERIC = 'Sign in failed. Please try again, or contact your administrator.';

/**
 * Turns whatever sign-in threw into one sentence somebody at a login screen can act on.
 *
 * The portal's own refusals — wrong password, blocked account, no tracker access — are
 * already written for the employee, so they are passed through in the portal's words. Every
 * other failure is ours to explain: a status code, a stack, or the word GraphQL on a login
 * screen tells the person nothing they can do anything about.
 */
export function describeLoginFailure(error: unknown): string {
  // `fetch` rejects with a TypeError when it cannot open the connection at all. Checked
  // first: a TypeError is an Error too.
  if (error instanceof TypeError) {
    return OFFLINE;
  }
  if (error instanceof TrackerAuthError) {
    return error.message === '' ? GENERIC : error.message;
  }

  const status = httpStatusOf(error);
  if (status === null) {
    return GENERIC;
  }
  if (status >= 500) {
    return UNAVAILABLE;
  }
  // A 4xx here is not the employee's doing: the app asked for something this portal does not
  // serve, which is what an app older than the portal looks like from the login screen.
  return OUTDATED;
}
