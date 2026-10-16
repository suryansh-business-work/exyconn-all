import { env } from '../../../config/env';
import { runAsPlatform } from '../../../lib/tenant';
import { badRequest, unauthenticated } from '../../../utils/errors';
import { UserModel } from '../../admin/user.model';
import { signInAddress } from '../../../lib/rateLimiterSignIn';
import { googleSignInReady, readGoogleConfig } from './google-sign-in.config';
import { GoogleSignInStateModel, GoogleSignInTicketModel } from './google-sign-in.models';
import {
  authorizeUrl,
  exchangeCode,
  randomToken,
  sha256,
  verifiedEmailOf,
} from './google-sign-in.oauth';

/**
 * "Continue with Google" for people who already have a portal account: Google proves the
 * email, the account it matches signs in. Nobody is created here; an unknown address is told so.
 */

const PORTAL_ORIGINS: ReadonlySet<string> = new Set(env.corsOrigins);

/** Only a portal page may be returned to, so the flow cannot be used as an open redirect. */
function portalPage(returnTo: string): string {
  let origin = '';
  try {
    origin = new URL(returnTo).origin;
  } catch {
    badRequest('That is not a portal address.');
  }
  if (!PORTAL_ORIGINS.has(origin)) {
    badRequest('That is not a portal address.');
  }
  return returnTo;
}

/** Where to send the browser: Google's consent page, with the state stored for the callback. */
export async function startGoogleSignIn(returnTo: string): Promise<string> {
  const config = await readGoogleConfig();
  if (!googleSignInReady(config)) {
    badRequest('Google sign-in is not switched on.');
  }
  const nonce = randomToken(24);
  const codeVerifier = randomToken(48);
  await runAsPlatform(() =>
    GoogleSignInStateModel.create({ nonce, codeVerifier, returnTo: portalPage(returnTo) }),
  );
  return authorizeUrl(config.clientId, nonce, codeVerifier);
}

/** The stored state for a callback, used once; null when it expired or was already used. */
export const takeGoogleState = (nonce: string) =>
  runAsPlatform(() => GoogleSignInStateModel.findOneAndDelete({ nonce }).lean());

/** A person who may sign in: present, active and not blocked. */
async function signableUser(filter: Record<string, unknown>) {
  const user = await runAsPlatform(() => UserModel.findOne(filter));
  if (!user?.isActive) {
    return null;
  }
  if (user.isBlocked) {
    throw new Error('Your account is temporarily blocked. Contact an administrator.');
  }
  return user;
}

/** Google's answer turned into a one-time ticket for the account its verified email matches. */
export async function finishGoogleSignIn(
  state: { codeVerifier: string },
  code: string,
): Promise<string> {
  const config = await readGoogleConfig();
  const idToken = await exchangeCode(config, code, state.codeVerifier);
  const email = signInAddress(verifiedEmailOf(idToken, config.clientId));
  const user = await signableUser({ email });
  if (!user) {
    throw new Error(`No active portal account uses ${email}. Ask an administrator to invite it.`);
  }
  const ticket = randomToken(32);
  await runAsPlatform(() =>
    GoogleSignInTicketModel.create({ ticketHash: sha256(ticket), userId: user.id }),
  );
  return ticket;
}

/** The account a ticket was issued for; each ticket works once, within two minutes. */
export async function redeemGoogleTicket(ticket: string) {
  const stored = await runAsPlatform(() =>
    GoogleSignInTicketModel.findOneAndDelete({ ticketHash: sha256(ticket) }).lean(),
  );
  const user = stored ? await signableUser({ _id: stored.userId }) : null;
  if (!user) {
    unauthenticated('That Google sign-in has expired. Try again.');
  }
  return user;
}
