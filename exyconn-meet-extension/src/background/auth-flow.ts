import { PORTAL_CONNECT_PATH, PORTAL_URL } from '../config';
import { buildConnectUrl, readAuthRedirect } from '../services/auth-redirect';
import { createPkcePair } from '../utils/pkce';
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

/**
 * Signs the extension in through the portal (authorization code + PKCE). The browser shows
 * the portal's own sign-in; the extension never sees a password.
 */
export async function signIn(): Promise<void> {
  const pkce = await createPkcePair();
  const redirectUri = chrome.identity.getRedirectURL('auth');
  const url = buildConnectUrl({
    portalUrl: PORTAL_URL,
    connectPath: PORTAL_CONNECT_PATH,
    extensionId: chrome.runtime.id,
    redirectUri,
    pkce,
  });
  const responseUrl = await chrome.identity.launchWebAuthFlow({ url, interactive: true });
  const code = readAuthRedirect(responseUrl, pkce.state);
  await auth.exchangeCode({
    code,
    verifier: pkce.verifier,
    redirectUri,
    deviceLabel: await deviceLabel(),
  });
  await getOrg(true);
  logger.info('Extension signed in');
  await publishAll();
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
