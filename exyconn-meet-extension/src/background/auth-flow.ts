import type { SignInStep } from '../services/auth';
import { clearOrg, getOrg } from './org';
import { auth, logger, registry } from './services';
import { publish } from './state';
import { stopCapture } from './capture';

/** "Chrome on mac" — names this sign-in in the portal's list of extension sessions. */
async function deviceLabel(): Promise<string> {
  const platform = await chrome.runtime.getPlatformInfo();
  return `Chrome on ${platform.os}`;
}

async function publishAll(): Promise<void> {
  const sessions = await registry.all();
  await Promise.all(sessions.map((session) => publish(session.tabId)));
}

/** Once a step has signed the extension in, loads the company's settings and tells every tab. */
async function finish(step: SignInStep): Promise<SignInStep> {
  if (step.mfaChallenge === null) {
    await getOrg(true);
    logger.info('Extension signed in');
    await publishAll();
  }
  return step;
}

/**
 * Signs the extension in with the person's portal email and password, typed into the
 * extension. With two-factor on, it answers the challenge to send back with the code.
 */
export async function signIn(email: string, password: string): Promise<SignInStep> {
  return finish(
    await auth.signInWithPassword({ email, password, deviceLabel: await deviceLabel() }),
  );
}

/** The second half of a two-factor sign-in: the code from the authenticator app. */
export async function completeSecondFactor(challenge: string, code: string): Promise<SignInStep> {
  return finish(
    await auth.completeSecondFactor({ challenge, code, deviceLabel: await deviceLabel() }),
  );
}

/** Stops every capture, revokes the sign-in on the server and forgets it locally. */
export async function signOut(): Promise<void> {
  const sessions = await registry.all();
  await Promise.all(sessions.map((session) => stopCapture(session.tabId, null)));
  const revoked = await auth.signOut();
  if (!revoked) {
    logger.warn('The portal did not confirm the sign-out; the local sign-in is removed');
  }
  await clearOrg();
  await publishAll();
}
